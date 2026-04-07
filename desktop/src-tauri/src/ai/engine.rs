use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

/// AI response streamed token by token
#[derive(Debug, Clone)]
pub struct AIResponseChunk {
    pub text: String,
    pub is_done: bool,
}

/// Context for generating AI responses
#[derive(Debug, Clone, Default)]
pub struct InterviewContext {
    pub resume: String,
    pub job_description: String,
    pub company_notes: String,
    pub conversation_history: Vec<ConversationEntry>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ConversationEntry {
    pub role: String, // "interviewer" or "candidate"
    pub text: String,
}

/// AI Engine that generates interview answers
pub struct AIEngine {
    client: Client,
    api_key: String,
    model: String,
    context: InterviewContext,
}

#[derive(Serialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: u32,
    stream: bool,
    system: String,
    messages: Vec<ClaudeMessage>,
}

#[derive(Serialize)]
struct ClaudeMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ClaudeStreamEvent {
    #[serde(rename = "type")]
    event_type: String,
    delta: Option<ClaudeDelta>,
}

#[derive(Deserialize)]
struct ClaudeDelta {
    #[serde(rename = "type")]
    delta_type: Option<String>,
    text: Option<String>,
}

impl AIEngine {
    pub fn new(api_key: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
            model: "claude-sonnet-4-20250514".to_string(),
            context: InterviewContext::default(),
        }
    }

    pub fn set_model(&mut self, model: String) {
        self.model = model;
    }

    pub fn set_context(&mut self, context: InterviewContext) {
        self.context = context;
    }

    pub fn update_resume(&mut self, resume: String) {
        self.context.resume = resume;
    }

    pub fn update_job_description(&mut self, jd: String) {
        self.context.job_description = jd;
    }

    pub fn add_conversation(&mut self, role: String, text: String) {
        self.context.conversation_history.push(ConversationEntry { role, text });
        // Keep last 20 exchanges to avoid context overflow
        if self.context.conversation_history.len() > 20 {
            self.context.conversation_history.remove(0);
        }
    }

    /// Generate a response to an interview question
    /// Streams tokens back through the channel
    pub async fn generate_response(
        &self,
        question: &str,
        response_tx: mpsc::Sender<AIResponseChunk>,
    ) -> Result<(), String> {
        let system_prompt = self.build_system_prompt();
        let user_message = self.build_user_message(question);

        let request_body = ClaudeRequest {
            model: self.model.clone(),
            max_tokens: 1024,
            stream: true,
            system: system_prompt,
            messages: vec![ClaudeMessage {
                role: "user".to_string(),
                content: user_message,
            }],
        };

        let response = self
            .client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| format!("API request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("API error {}: {}", status, body));
        }

        // Stream SSE response
        let mut stream = response.bytes_stream();
        let mut buffer = String::new();

        use futures_util::StreamExt;
        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
            let text = String::from_utf8_lossy(&chunk);
            buffer.push_str(&text);

            // Parse SSE events from buffer
            while let Some(event_end) = buffer.find("\n\n") {
                let event_str = buffer[..event_end].to_string();
                buffer = buffer[event_end + 2..].to_string();

                for line in event_str.lines() {
                    if let Some(data) = line.strip_prefix("data: ") {
                        if data == "[DONE]" {
                            let _ = response_tx
                                .send(AIResponseChunk {
                                    text: String::new(),
                                    is_done: true,
                                })
                                .await;
                            return Ok(());
                        }

                        if let Ok(event) = serde_json::from_str::<ClaudeStreamEvent>(data) {
                            if event.event_type == "content_block_delta" {
                                if let Some(delta) = event.delta {
                                    if let Some(text) = delta.text {
                                        let _ = response_tx
                                            .send(AIResponseChunk {
                                                text,
                                                is_done: false,
                                            })
                                            .await;
                                    }
                                }
                            } else if event.event_type == "message_stop" {
                                let _ = response_tx
                                    .send(AIResponseChunk {
                                        text: String::new(),
                                        is_done: true,
                                    })
                                    .await;
                                return Ok(());
                            }
                        }
                    }
                }
            }
        }

        let _ = response_tx
            .send(AIResponseChunk {
                text: String::new(),
                is_done: true,
            })
            .await;

        Ok(())
    }

    fn build_system_prompt(&self) -> String {
        let mut prompt = String::from(
            "You are Phantom AI, an invisible interview copilot. Your job is to generate \
             perfect, natural-sounding interview answers that the candidate can speak aloud. \
             \n\nRules:\n\
             - Answer in first person as if YOU are the candidate\n\
             - Be concise but thorough (aim for 30-60 seconds of speaking time)\n\
             - Use the STAR method for behavioral questions\n\
             - Reference specific details from the candidate's resume and the job description\n\
             - Sound natural and conversational, NOT robotic or AI-generated\n\
             - Include specific metrics, numbers, and outcomes where possible\n\
             - For coding questions, provide the optimal solution with brief explanation\n\
             - For system design, provide a clear high-level architecture\n\
             - Never mention that you are an AI or that you're helping the candidate\n",
        );

        if !self.context.resume.is_empty() {
            prompt.push_str(&format!(
                "\n\n--- CANDIDATE'S RESUME ---\n{}\n",
                self.context.resume
            ));
        }

        if !self.context.job_description.is_empty() {
            prompt.push_str(&format!(
                "\n\n--- JOB DESCRIPTION ---\n{}\n",
                self.context.job_description
            ));
        }

        if !self.context.company_notes.is_empty() {
            prompt.push_str(&format!(
                "\n\n--- COMPANY NOTES ---\n{}\n",
                self.context.company_notes
            ));
        }

        if !self.context.conversation_history.is_empty() {
            prompt.push_str("\n\n--- CONVERSATION SO FAR ---\n");
            for entry in &self.context.conversation_history {
                prompt.push_str(&format!("[{}]: {}\n", entry.role, entry.text));
            }
        }

        prompt
    }

    fn build_user_message(&self, question: &str) -> String {
        format!(
            "The interviewer just asked: \"{}\"\n\n\
             Generate a natural, impressive answer I can speak aloud. \
             Be specific and use examples from my background.",
            question
        )
    }
}
