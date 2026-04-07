use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use futures_util::StreamExt;

use super::engine::AIResponseChunk;

/// Ollama API request
#[derive(Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    system: String,
    stream: bool,
    options: OllamaOptions,
}

#[derive(Serialize)]
struct OllamaOptions {
    temperature: f64,
    top_p: f64,
    num_predict: i32,
    repeat_penalty: f64,
}

/// Ollama streaming response chunk
#[derive(Deserialize)]
struct OllamaStreamChunk {
    response: Option<String>,
    done: bool,
}

/// Local Ollama-based AI engine
pub struct OllamaEngine {
    client: Client,
    model: String,
    base_url: String,
    resume: String,
    job_description: String,
    company_notes: String,
    conversation_history: Vec<String>,
}

impl OllamaEngine {
    pub fn new(model: Option<String>) -> Self {
        Self {
            client: Client::new(),
            model: model.unwrap_or_else(|| "llama3.1:8b".to_string()),
            base_url: "http://localhost:11434".to_string(),
            resume: String::new(),
            job_description: String::new(),
            company_notes: String::new(),
            conversation_history: Vec::new(),
        }
    }

    pub fn set_model(&mut self, model: String) {
        self.model = model;
    }

    pub fn set_resume(&mut self, resume: String) {
        self.resume = resume;
    }

    pub fn set_job_description(&mut self, jd: String) {
        self.job_description = jd;
    }

    pub fn set_company_notes(&mut self, notes: String) {
        self.company_notes = notes;
    }

    pub fn add_to_history(&mut self, entry: String) {
        self.conversation_history.push(entry);
        if self.conversation_history.len() > 20 {
            self.conversation_history.remove(0);
        }
    }

    /// Check if Ollama is running
    pub async fn is_available(&self) -> bool {
        self.client
            .get(format!("{}/api/tags", self.base_url))
            .timeout(std::time::Duration::from_secs(2))
            .send()
            .await
            .map(|r| r.status().is_success())
            .unwrap_or(false)
    }

    /// Generate a response, streaming tokens back
    pub async fn generate_response(
        &self,
        question: &str,
        tx: mpsc::Sender<AIResponseChunk>,
    ) -> Result<(), String> {
        let system_prompt = self.build_system_prompt();
        let user_prompt = format!(
            "The interviewer just asked: \"{}\"\n\n\
             Generate a natural, impressive answer I can speak aloud. \
             Be specific, use the STAR method for behavioral questions. \
             For coding questions, give the optimal solution with explanation. \
             Keep it 30-60 seconds of speaking time. Sound human, not robotic.",
            question
        );

        let request = OllamaRequest {
            model: self.model.clone(),
            prompt: user_prompt,
            system: system_prompt,
            stream: true,
            options: OllamaOptions {
                temperature: 0.7,
                top_p: 0.9,
                num_predict: 512,
                repeat_penalty: 1.1,
            },
        };

        let response = self
            .client
            .post(format!("{}/api/generate", self.base_url))
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Ollama request failed: {}. Is Ollama running?", e))?;

        if !response.status().is_success() {
            let body = response.text().await.unwrap_or_default();
            return Err(format!("Ollama error: {}", body));
        }

        let mut stream = response.bytes_stream();
        let mut buffer = Vec::new();

        while let Some(chunk) = stream.next().await {
            let bytes = chunk.map_err(|e| format!("Stream error: {}", e))?;
            buffer.extend_from_slice(&bytes);

            // Try to parse complete JSON lines from buffer
            while let Some(newline_pos) = buffer.iter().position(|&b| b == b'\n') {
                let line: Vec<u8> = buffer.drain(..=newline_pos).collect();
                let line_str = String::from_utf8_lossy(&line);

                if let Ok(chunk) = serde_json::from_str::<OllamaStreamChunk>(line_str.trim()) {
                    if chunk.done {
                        let _ = tx.send(AIResponseChunk {
                            text: String::new(),
                            is_done: true,
                        }).await;
                        return Ok(());
                    }

                    if let Some(text) = chunk.response {
                        if !text.is_empty() {
                            let _ = tx.send(AIResponseChunk {
                                text,
                                is_done: false,
                            }).await;
                        }
                    }
                }
            }
        }

        let _ = tx.send(AIResponseChunk {
            text: String::new(),
            is_done: true,
        }).await;

        Ok(())
    }

    fn build_system_prompt(&self) -> String {
        let mut prompt = String::from(
            "You are an expert interview coach. Your job is to generate \
             perfect, natural-sounding interview answers that the candidate can speak aloud.\n\n\
             CRITICAL RULES:\n\
             - Answer in FIRST PERSON as if YOU are the candidate\n\
             - Be concise but thorough (30-60 seconds speaking time)\n\
             - Use STAR method (Situation, Task, Action, Result) for behavioral questions\n\
             - Include specific metrics, numbers, and outcomes\n\
             - Sound natural and conversational, NOT robotic\n\
             - For coding: provide optimal solution with brief time/space complexity\n\
             - For system design: clear high-level architecture with trade-offs\n\
             - NEVER mention you are an AI or that you're helping anyone\n\
             - NEVER use phrases like \"As an AI\" or \"I'd be happy to help\"\n\
             - Speak as if you're the actual candidate with real experience\n",
        );

        if !self.resume.is_empty() {
            prompt.push_str(&format!(
                "\n--- MY RESUME ---\n{}\n",
                self.resume
            ));
        }

        if !self.job_description.is_empty() {
            prompt.push_str(&format!(
                "\n--- JOB DESCRIPTION ---\n{}\n",
                self.job_description
            ));
        }

        if !self.company_notes.is_empty() {
            prompt.push_str(&format!(
                "\n--- COMPANY RESEARCH ---\n{}\n",
                self.company_notes
            ));
        }

        if !self.conversation_history.is_empty() {
            prompt.push_str("\n--- INTERVIEW SO FAR ---\n");
            for entry in &self.conversation_history {
                prompt.push_str(&format!("{}\n", entry));
            }
        }

        prompt
    }
}
