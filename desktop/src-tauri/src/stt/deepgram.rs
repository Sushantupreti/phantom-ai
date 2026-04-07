use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::Message};
use url::Url;

/// A transcription result from Deepgram
#[derive(Debug, Clone)]
pub struct TranscriptResult {
    pub text: String,
    pub is_final: bool,
    pub speaker: Option<u32>,
    pub confidence: f64,
}

/// Deepgram WebSocket response structures
#[derive(Deserialize, Debug)]
struct DeepgramResponse {
    #[serde(rename = "type")]
    msg_type: Option<String>,
    channel: Option<Channel>,
    is_final: Option<bool>,
}

#[derive(Deserialize, Debug)]
struct Channel {
    alternatives: Vec<Alternative>,
}

#[derive(Deserialize, Debug)]
struct Alternative {
    transcript: String,
    confidence: f64,
    words: Option<Vec<Word>>,
}

#[derive(Deserialize, Debug)]
struct Word {
    word: String,
    speaker: Option<u32>,
}

/// Manages a Deepgram WebSocket connection for real-time STT
pub struct DeepgramSTT {
    api_key: String,
    audio_sender: Option<mpsc::Sender<Vec<u8>>>,
}

impl DeepgramSTT {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            audio_sender: None,
        }
    }

    /// Start the Deepgram WebSocket connection
    /// Returns a receiver for transcript results and a sender for audio data
    pub async fn start(
        &mut self,
        transcript_tx: mpsc::Sender<TranscriptResult>,
    ) -> Result<mpsc::Sender<Vec<u8>>, String> {
        let url_str = format!(
            "wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&model=nova-3&punctuate=true&interim_results=true&endpointing=300&smart_format=true"
        );

        let url = Url::parse(&url_str).map_err(|e| format!("Invalid URL: {}", e))?;

        let request = tokio_tungstenite::tungstenite::http::Request::builder()
            .uri(url_str.clone())
            .header("Authorization", format!("Token {}", self.api_key))
            .header("Host", "api.deepgram.com")
            .header("Connection", "Upgrade")
            .header("Upgrade", "websocket")
            .header("Sec-WebSocket-Version", "13")
            .header(
                "Sec-WebSocket-Key",
                tokio_tungstenite::tungstenite::handshake::client::generate_key(),
            )
            .body(())
            .map_err(|e| format!("Failed to build request: {}", e))?;

        let (ws_stream, _) = connect_async(request)
            .await
            .map_err(|e| format!("Failed to connect to Deepgram: {}", e))?;

        log::info!("Connected to Deepgram WebSocket");

        let (mut write, mut read) = ws_stream.split();

        // Channel for sending audio to the WebSocket
        let (audio_tx, mut audio_rx) = mpsc::channel::<Vec<u8>>(200);

        // Task: forward audio bytes to WebSocket
        tokio::spawn(async move {
            while let Some(audio_data) = audio_rx.recv().await {
                if write.send(Message::Binary(audio_data.into())).await.is_err() {
                    log::error!("Failed to send audio to Deepgram");
                    break;
                }
            }
            // Send close frame
            let _ = write.send(Message::Text(r#"{"type":"CloseStream"}"#.into())).await;
            log::info!("Audio sender closed");
        });

        // Task: read transcript results from WebSocket
        tokio::spawn(async move {
            while let Some(msg) = read.next().await {
                match msg {
                    Ok(Message::Text(text)) => {
                        if let Ok(response) = serde_json::from_str::<DeepgramResponse>(&text) {
                            if let Some(channel) = response.channel {
                                if let Some(alt) = channel.alternatives.first() {
                                    if !alt.transcript.is_empty() {
                                        let speaker = alt
                                            .words
                                            .as_ref()
                                            .and_then(|w| w.first())
                                            .and_then(|w| w.speaker);

                                        let result = TranscriptResult {
                                            text: alt.transcript.clone(),
                                            is_final: response.is_final.unwrap_or(false),
                                            speaker,
                                            confidence: alt.confidence,
                                        };

                                        if transcript_tx.send(result).await.is_err() {
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Ok(Message::Close(_)) => {
                        log::info!("Deepgram WebSocket closed");
                        break;
                    }
                    Err(e) => {
                        log::error!("Deepgram WebSocket error: {}", e);
                        break;
                    }
                    _ => {}
                }
            }
        });

        self.audio_sender = Some(audio_tx.clone());
        Ok(audio_tx)
    }
}
