use std::io::Write;
use std::process::Command;
use std::path::PathBuf;

/// Result from local Whisper transcription
#[derive(Debug, Clone)]
pub struct WhisperResult {
    pub text: String,
    pub is_final: bool,
}

/// Get the path to the Whisper model
fn model_path() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_default();
    PathBuf::from(home)
        .join(".phantom-ai")
        .join("models")
        .join("ggml-base.en.bin")
}

/// Transcribe a WAV file using whisper-cpp CLI
pub fn transcribe_wav(wav_path: &str) -> Result<String, String> {
    let model = model_path();
    if !model.exists() {
        return Err("Whisper model not found. Expected at ~/.phantom-ai/models/ggml-base.en.bin".into());
    }

    let output = Command::new("whisper-cpp")
        .args([
            "--model", model.to_str().unwrap(),
            "--file", wav_path,
            "--no-timestamps",
            "--threads", "4",
            "--language", "en",
        ])
        .output()
        .map_err(|e| format!("whisper-cpp failed: {}", e))?;

    if output.status.success() {
        let text = String::from_utf8_lossy(&output.stdout)
            .trim()
            .to_string();
        Ok(text)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("whisper-cpp error: {}", stderr))
    }
}

/// Write PCM f32 samples to a temporary WAV file and transcribe
pub fn transcribe_audio(samples: &[f32], sample_rate: u32) -> Result<String, String> {
    let tmp_path = std::env::temp_dir().join("phantom_whisper_input.wav");
    let tmp_str = tmp_path.to_str().unwrap();

    // Write WAV file using hound
    let spec = hound::WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut writer = hound::WavWriter::create(tmp_str, spec)
        .map_err(|e| format!("Failed to create WAV: {}", e))?;

    for &sample in samples {
        let clamped = sample.max(-1.0).min(1.0);
        let i16_val = (clamped * 32767.0) as i16;
        writer.write_sample(i16_val)
            .map_err(|e| format!("Failed to write sample: {}", e))?;
    }
    writer.finalize()
        .map_err(|e| format!("Failed to finalize WAV: {}", e))?;

    let result = transcribe_wav(tmp_str);

    // Clean up
    let _ = std::fs::remove_file(&tmp_path);

    result
}

/// Check if Whisper is available
pub fn is_available() -> bool {
    Command::new("whisper-cpp")
        .arg("--help")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
        && model_path().exists()
}
