use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, WebviewWindow,
};
use tauri_plugin_global_shortcut::GlobalShortcutExt;
use serde::Serialize;
use std::sync::Arc;
use std::sync::Mutex as StdMutex;

mod audio;
mod stt;
mod ai;
mod ocr;

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

#[cfg(target_os = "macos")]
mod macos_stealth {
    use cocoa::base::id;

    pub unsafe fn apply_stealth(ns_window: id) {
        let _: () = msg_send![ns_window, setSharingType: 0i64];
        let _: () = msg_send![ns_window, setLevel: 3i64];
        let collection_behavior: u64 = (1 << 0) | (1 << 4) | (1 << 6) | (1 << 7);
        let _: () = msg_send![ns_window, setCollectionBehavior: collection_behavior];
    }
}

/// App state — only Send+Sync fields
struct PhantomState {
    deepgram_key: StdMutex<String>,
    claude_key: StdMutex<String>,
    is_listening: StdMutex<bool>,
    audio_receiver: StdMutex<Option<crossbeam_channel::Receiver<audio::capture::AudioChunk>>>,
    resume_text: StdMutex<String>,
    jd_text: StdMutex<String>,
    company_notes: StdMutex<String>,
}

#[derive(Clone, Serialize)]
struct TranscriptEvent {
    text: String,
    is_final: bool,
    speaker: String,
}

#[derive(Clone, Serialize)]
struct AIResponseEvent {
    text: String,
    is_done: bool,
}

#[derive(Clone, Serialize)]
struct StatusEvent {
    status: String,
    message: String,
}

// ==================== TAURI COMMANDS ====================

#[tauri::command]
fn resize_overlay(window: WebviewWindow, width: f64, height: f64) {
    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }));
}

#[tauri::command]
fn set_overlay_position(window: WebviewWindow, x: f64, y: f64) {
    let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
}

#[tauri::command]
fn toggle_overlay(window: WebviewWindow) {
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[tauri::command]
fn set_opacity(window: WebviewWindow, opacity: f64) {
    #[cfg(target_os = "macos")]
    {
        if let Ok(ns_window) = window.ns_window() {
            unsafe {
                let _: () = objc::msg_send![ns_window as cocoa::base::id, setAlphaValue: opacity];
            }
        }
    }
    let _ = (window, opacity);
}

#[tauri::command]
fn set_click_through(window: WebviewWindow, enabled: bool) {
    let _ = window.set_ignore_cursor_events(enabled);
}

#[tauri::command]
fn center_overlay_top(window: WebviewWindow) {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let screen_size = monitor.size();
        let scale = monitor.scale_factor();
        let screen_width = screen_size.width as f64 / scale;
        if let Ok(win_size) = window.outer_size() {
            let win_width = win_size.width as f64 / scale;
            let x = (screen_width - win_width) / 2.0;
            let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                x, y: 40.0,
            }));
        }
    }
}

#[tauri::command]
fn set_api_keys(
    state: tauri::State<'_, PhantomState>,
    deepgram_key: String,
    claude_key: String,
) {
    *state.deepgram_key.lock().unwrap() = deepgram_key;
    *state.claude_key.lock().unwrap() = claude_key;
    log::info!("API keys configured");
}

#[tauri::command]
fn start_listening(
    app: tauri::AppHandle,
    state: tauri::State<'_, PhantomState>,
) -> Result<(), String> {
    if *state.is_listening.lock().unwrap() {
        return Err("Already listening".to_string());
    }

    // Start mic capture on a separate thread (cpal::Stream is !Send)
    let (audio_tx, audio_rx) = crossbeam_channel::bounded(100);

    std::thread::spawn(move || {
        let mut mic = audio::capture::MicCapture::new();
        if let Err(e) = mic.start() {
            log::error!("Mic capture failed: {}", e);
            return;
        }

        // Forward from mic's internal receiver to our channel
        let mic_rx = mic.receiver.clone();
        loop {
            match mic_rx.recv() {
                Ok(chunk) => {
                    if audio_tx.send(chunk).is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
        mic.stop();
    });

    *state.audio_receiver.lock().unwrap() = Some(audio_rx.clone());
    *state.is_listening.lock().unwrap() = true;

    let _ = app.emit("status", StatusEvent {
        status: "listening".into(),
        message: "Microphone active — listening...".into(),
    });

    // Spawn local Whisper + Ollama pipeline
    let app_handle = app.clone();

    tauri::async_runtime::spawn(async move {
        use audio::capture::{resample_to_16k, to_mono};
        use stt::whisper_local;
        use ai::ollama::OllamaEngine;

        // Check Whisper availability
        if !whisper_local::is_available() {
            let _ = app_handle.emit("status", StatusEvent {
                status: "error".into(),
                message: "Whisper not found. Install: brew install whisper-cpp".into(),
            });
            return;
        }

        // Check Ollama availability
        let ollama = OllamaEngine::new(None);
        if !ollama.is_available().await {
            let _ = app_handle.emit("status", StatusEvent {
                status: "error".into(),
                message: "Ollama not running. Start with: ollama serve".into(),
            });
            return;
        }

        let _ = app_handle.emit("status", StatusEvent {
            status: "ready".into(),
            message: "Local AI ready (Whisper + Ollama)".into(),
        });

        // Accumulate ~3 seconds of audio then transcribe
        let mut audio_buffer: Vec<f32> = Vec::new();
        let mut buffer_sample_rate = 16000u32;
        let chunk_duration_samples = 16000 * 3; // 3 seconds at 16kHz

        loop {
            match audio_rx.recv() {
                Ok(chunk) => {
                    let mono = to_mono(&chunk.samples, chunk.channels);
                    let resampled = resample_to_16k(&mono, chunk.sample_rate);
                    buffer_sample_rate = 16000;
                    audio_buffer.extend_from_slice(&resampled);

                    // When we have ~3 seconds, transcribe
                    if audio_buffer.len() >= chunk_duration_samples {
                        let samples_to_process: Vec<f32> = audio_buffer.drain(..).collect();

                        let app_for_stt = app_handle.clone();

                        // Transcribe in a blocking thread
                        let transcript = tokio::task::spawn_blocking(move || {
                            whisper_local::transcribe_audio(&samples_to_process, buffer_sample_rate)
                        }).await;

                        match transcript {
                            Ok(Ok(text)) if !text.is_empty() && text.len() > 3 => {
                                // Filter out whisper artifacts like [BLANK_AUDIO], (silence), etc
                                let clean_text = text
                                    .replace("[BLANK_AUDIO]", "")
                                    .replace("(silence)", "")
                                    .replace("[MUSIC]", "")
                                    .trim()
                                    .to_string();

                                if clean_text.len() > 5 {
                                    let _ = app_for_stt.emit("transcript", TranscriptEvent {
                                        text: clean_text.clone(),
                                        is_final: true,
                                        speaker: "interviewer".into(),
                                    });

                                    // Check if it's a question
                                    let q = clean_text.to_lowercase();
                                    let is_question = q.contains('?')
                                        || q.starts_with("tell me")
                                        || q.starts_with("can you")
                                        || q.starts_with("how")
                                        || q.starts_with("what")
                                        || q.starts_with("why")
                                        || q.starts_with("describe")
                                        || q.starts_with("explain")
                                        || q.starts_with("walk me")
                                        || q.starts_with("give me")
                                        || q.starts_with("do you")
                                        || q.starts_with("have you")
                                        || q.starts_with("where");

                                    if is_question && clean_text.len() > 15 {
                                        let _ = app_for_stt.emit("status", StatusEvent {
                                            status: "generating".into(),
                                            message: "Generating answer...".into(),
                                        });

                                        let mut engine = OllamaEngine::new(None);
                                        let (ai_tx, mut ai_rx) = tokio::sync::mpsc::channel::<ai::engine::AIResponseChunk>(100);
                                        let question = clean_text.clone();
                                        let app_for_ai = app_for_stt.clone();

                                        tokio::spawn(async move {
                                            while let Some(chunk) = ai_rx.recv().await {
                                                let _ = app_for_ai.emit("ai_response", AIResponseEvent {
                                                    text: chunk.text,
                                                    is_done: chunk.is_done,
                                                });
                                            }
                                        });

                                        if let Err(e) = engine.generate_response(&question, ai_tx).await {
                                            log::error!("Ollama error: {}", e);
                                            let _ = app_for_stt.emit("status", StatusEvent {
                                                status: "error".into(),
                                                message: format!("Ollama: {}", e),
                                            });
                                        }
                                    }
                                }
                            }
                            Ok(Err(e)) => {
                                log::error!("Whisper error: {}", e);
                            }
                            _ => {}
                        }
                    }
                }
                Err(_) => break,
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn stop_listening(
    app: tauri::AppHandle,
    state: tauri::State<'_, PhantomState>,
) {
    *state.is_listening.lock().unwrap() = false;
    *state.audio_receiver.lock().unwrap() = None;
    let _ = app.emit("status", StatusEvent {
        status: "stopped".into(),
        message: "Stopped listening".into(),
    });
}

#[tauri::command]
async fn generate_answer(
    app: tauri::AppHandle,
    _state: tauri::State<'_, PhantomState>,
    question: String,
) -> Result<(), String> {
    let engine = ai::ollama::OllamaEngine::new(None);

    if !engine.is_available().await {
        return Err("Ollama not running. Start with: ollama serve".to_string());
    }

    let (tx, mut rx) = tokio::sync::mpsc::channel::<ai::engine::AIResponseChunk>(100);
    let app_handle = app.clone();

    tokio::spawn(async move {
        while let Some(chunk) = rx.recv().await {
            let _ = app_handle.emit("ai_response", AIResponseEvent {
                text: chunk.text,
                is_done: chunk.is_done,
            });
        }
    });

    engine.generate_response(&question, tx).await
}

#[tauri::command]
fn is_listening(state: tauri::State<'_, PhantomState>) -> bool {
    *state.is_listening.lock().unwrap()
}

/// Capture screen and run OCR, then optionally send to AI
#[tauri::command]
async fn screenshot_ocr(
    app: tauri::AppHandle,
    state: tauri::State<'_, PhantomState>,
    region: bool,
) -> Result<String, String> {
    let result = ocr::capture_and_ocr(region)?;

    let _ = app.emit("ocr_result", &result);
    let _ = app.emit("status", StatusEvent {
        status: "ocr_done".into(),
        message: format!("OCR captured {} chars", result.text.len()),
    });

    // Auto-send to Ollama for analysis
    {
        let engine = ai::ollama::OllamaEngine::new(None);
        let (tx, mut rx) = tokio::sync::mpsc::channel::<ai::engine::AIResponseChunk>(100);
        let app_handle = app.clone();
        let screen_text = result.text.clone();

        tokio::spawn(async move {
            while let Some(chunk) = rx.recv().await {
                let _ = app_handle.emit("ai_response", AIResponseEvent {
                    text: chunk.text,
                    is_done: chunk.is_done,
                });
            }
        });

        let question = format!(
            "I see the following content on my screen during an interview. Help me with it:\n\n{}",
            screen_text
        );
        let _ = engine.generate_response(&question, tx).await;
    }

    Ok(result.text)
}

/// Save resume text to context
#[tauri::command]
fn set_resume(state: tauri::State<'_, PhantomState>, text: String) {
    *state.resume_text.lock().unwrap() = text;
    log::info!("Resume context updated");
}

/// Save job description text to context
#[tauri::command]
fn set_job_description(state: tauri::State<'_, PhantomState>, text: String) {
    *state.jd_text.lock().unwrap() = text;
    log::info!("Job description context updated");
}

/// Save company notes to context
#[tauri::command]
fn set_company_notes(state: tauri::State<'_, PhantomState>, text: String) {
    *state.company_notes.lock().unwrap() = text;
    log::info!("Company notes updated");
}

// ==================== APP SETUP ====================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(PhantomState {
            deepgram_key: StdMutex::new(String::new()),
            claude_key: StdMutex::new(String::new()),
            is_listening: StdMutex::new(false),
            audio_receiver: StdMutex::new(None),
            resume_text: StdMutex::new(String::new()),
            jd_text: StdMutex::new(String::new()),
            company_notes: StdMutex::new(String::new()),
        })
        .setup(|app| {
            // --- System Tray ---
            let show = MenuItem::with_id(app, "show", "Show Phantom", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "Hide Phantom", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &hide, &quit])?;

            TrayIconBuilder::with_id("phantom-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Phantom AI")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("phantom-overlay") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(w) = app.get_webview_window("phantom-overlay") {
                            let _ = w.hide();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            // --- macOS Stealth ---
            #[cfg(target_os = "macos")]
            {
                if let Some(window) = app.get_webview_window("phantom-overlay") {
                    if let Ok(ns_window) = window.ns_window() {
                        unsafe {
                            macos_stealth::apply_stealth(ns_window as cocoa::base::id);
                        }
                    }
                }
            }

            // --- Global Shortcut ---
            use tauri_plugin_global_shortcut::ShortcutState;
            app.global_shortcut().on_shortcut(
                "CmdOrCtrl+Shift+P".parse::<tauri_plugin_global_shortcut::Shortcut>().unwrap(),
                move |app_handle: &tauri::AppHandle, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        if let Some(w) = app_handle.get_webview_window("phantom-overlay") {
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                },
            )?;

            // Cmd+Shift+S = Screenshot OCR
            app.global_shortcut().on_shortcut(
                "CmdOrCtrl+Shift+S".parse::<tauri_plugin_global_shortcut::Shortcut>().unwrap(),
                move |app_handle: &tauri::AppHandle, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        let app_clone = app_handle.clone();
                        tauri::async_runtime::spawn(async move {
                            match ocr::capture_and_ocr(false) {
                                Ok(result) => {
                                    let _ = app_clone.emit("ocr_result", &result);
                                    let _ = app_clone.emit("transcript", TranscriptEvent {
                                        text: format!("[Screen OCR]: {}", result.text),
                                        is_final: true,
                                        speaker: "screen".into(),
                                    });
                                }
                                Err(e) => {
                                    let _ = app_clone.emit("status", StatusEvent {
                                        status: "error".into(),
                                        message: format!("OCR failed: {}", e),
                                    });
                                }
                            }
                        });
                    }
                },
            )?;

            // Center on startup
            if let Some(window) = app.get_webview_window("phantom-overlay") {
                if let Ok(Some(monitor)) = window.current_monitor() {
                    let screen_size = monitor.size();
                    let scale = monitor.scale_factor();
                    let screen_width = screen_size.width as f64 / scale;
                    let x = (screen_width - 600.0) / 2.0;
                    let _ = window.set_position(tauri::Position::Logical(
                        tauri::LogicalPosition { x, y: 40.0 },
                    ));
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            resize_overlay,
            set_overlay_position,
            toggle_overlay,
            set_opacity,
            set_click_through,
            center_overlay_top,
            set_api_keys,
            start_listening,
            stop_listening,
            generate_answer,
            is_listening,
            screenshot_ocr,
            set_resume,
            set_job_description,
            set_company_notes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Phantom AI");
}
