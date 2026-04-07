use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use crossbeam_channel::{bounded, Receiver, Sender};
use parking_lot::Mutex;
use std::sync::Arc;

/// Audio chunk containing PCM samples
#[derive(Clone)]
pub struct AudioChunk {
    pub samples: Vec<f32>,
    pub sample_rate: u32,
    pub channels: u16,
}

/// Manages microphone audio capture
pub struct MicCapture {
    stream: Option<cpal::Stream>,
    is_running: Arc<Mutex<bool>>,
    pub receiver: Receiver<AudioChunk>,
    sender: Sender<AudioChunk>,
}

impl MicCapture {
    pub fn new() -> Self {
        let (sender, receiver) = bounded(100);
        Self {
            stream: None,
            is_running: Arc::new(Mutex::new(false)),
            receiver,
            sender,
        }
    }

    /// Start capturing from the default microphone
    pub fn start(&mut self) -> Result<(), String> {
        let host = cpal::default_host();
        let device = host
            .default_input_device()
            .ok_or("No input device available")?;

        log::info!("Using input device: {}", device.name().unwrap_or_default());

        let config = device
            .default_input_config()
            .map_err(|e| format!("Failed to get input config: {}", e))?;

        log::info!(
            "Input config: {} Hz, {} channels, {:?}",
            config.sample_rate().0,
            config.channels(),
            config.sample_format()
        );

        let sample_rate = config.sample_rate().0;
        let channels = config.channels();
        let sender = self.sender.clone();
        let is_running = self.is_running.clone();

        // Buffer to accumulate ~100ms of audio before sending
        let buffer_size = (sample_rate as usize * channels as usize) / 10; // 100ms
        let buffer: Arc<Mutex<Vec<f32>>> = Arc::new(Mutex::new(Vec::with_capacity(buffer_size)));

        let buffer_clone = buffer.clone();
        let stream = match config.sample_format() {
            cpal::SampleFormat::F32 => device
                .build_input_stream(
                    &config.into(),
                    move |data: &[f32], _: &cpal::InputCallbackInfo| {
                        let mut buf = buffer_clone.lock();
                        buf.extend_from_slice(data);

                        if buf.len() >= buffer_size {
                            let samples = buf.drain(..).collect();
                            let _ = sender.try_send(AudioChunk {
                                samples,
                                sample_rate,
                                channels,
                            });
                        }
                    },
                    move |err| {
                        log::error!("Audio input error: {}", err);
                    },
                    None,
                )
                .map_err(|e| format!("Failed to build input stream: {}", e))?,
            cpal::SampleFormat::I16 => device
                .build_input_stream(
                    &config.into(),
                    move |data: &[i16], _: &cpal::InputCallbackInfo| {
                        let mut buf = buffer_clone.lock();
                        let float_samples: Vec<f32> =
                            data.iter().map(|&s| s as f32 / 32768.0).collect();
                        buf.extend_from_slice(&float_samples);

                        if buf.len() >= buffer_size {
                            let samples = buf.drain(..).collect();
                            let _ = sender.try_send(AudioChunk {
                                samples,
                                sample_rate,
                                channels,
                            });
                        }
                    },
                    move |err| {
                        log::error!("Audio input error: {}", err);
                    },
                    None,
                )
                .map_err(|e| format!("Failed to build input stream: {}", e))?,
            format => return Err(format!("Unsupported sample format: {:?}", format)),
        };

        stream
            .play()
            .map_err(|e| format!("Failed to start audio stream: {}", e))?;

        *is_running.lock() = true;
        self.stream = Some(stream);

        log::info!("Microphone capture started");
        Ok(())
    }

    /// Stop capturing
    pub fn stop(&mut self) {
        self.stream = None;
        *self.is_running.lock() = false;
        log::info!("Microphone capture stopped");
    }

    pub fn is_running(&self) -> bool {
        *self.is_running.lock()
    }
}

/// Convert f32 PCM samples to 16-bit PCM bytes (for Deepgram)
pub fn f32_to_i16_bytes(samples: &[f32]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(samples.len() * 2);
    for &sample in samples {
        let clamped = sample.max(-1.0).min(1.0);
        let i16_val = (clamped * 32767.0) as i16;
        bytes.extend_from_slice(&i16_val.to_le_bytes());
    }
    bytes
}

/// Downmix stereo to mono
pub fn to_mono(samples: &[f32], channels: u16) -> Vec<f32> {
    if channels == 1 {
        return samples.to_vec();
    }
    let ch = channels as usize;
    samples
        .chunks(ch)
        .map(|frame| frame.iter().sum::<f32>() / ch as f32)
        .collect()
}

/// Simple resampler from any sample rate to 16kHz (Deepgram expects 16kHz)
pub fn resample_to_16k(samples: &[f32], from_rate: u32) -> Vec<f32> {
    if from_rate == 16000 {
        return samples.to_vec();
    }
    let ratio = 16000.0 / from_rate as f64;
    let output_len = (samples.len() as f64 * ratio) as usize;
    let mut output = Vec::with_capacity(output_len);

    for i in 0..output_len {
        let src_idx = i as f64 / ratio;
        let idx = src_idx as usize;
        let frac = src_idx - idx as f64;

        if idx + 1 < samples.len() {
            let interpolated = samples[idx] as f64 * (1.0 - frac) + samples[idx + 1] as f64 * frac;
            output.push(interpolated as f32);
        } else if idx < samples.len() {
            output.push(samples[idx]);
        }
    }
    output
}
