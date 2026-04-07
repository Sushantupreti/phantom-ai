use std::process::Command;
use std::path::PathBuf;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct OcrResult {
    pub text: String,
    pub source: String, // "fullscreen" or "region"
}

/// Take a screenshot and run OCR on it using macOS native tools
/// Uses `screencapture` for screenshot + a Python one-liner with Vision framework
pub fn capture_and_ocr(region: bool) -> Result<OcrResult, String> {
    let tmp_path = std::env::temp_dir().join("phantom_ocr_capture.png");
    let tmp_str = tmp_path.to_str().unwrap();

    // Take screenshot using macOS screencapture
    let mut args = vec!["-x"]; // silent (no shutter sound)
    if region {
        args.push("-i"); // interactive selection
    }
    args.push(tmp_str);

    let status = Command::new("screencapture")
        .args(&args)
        .status()
        .map_err(|e| format!("Failed to take screenshot: {}", e))?;

    if !status.success() {
        return Err("Screenshot cancelled or failed".to_string());
    }

    if !tmp_path.exists() {
        return Err("Screenshot file not created".to_string());
    }

    // Run OCR using Python + Vision framework (built into macOS)
    let ocr_script = r#"
import Vision
import Cocoa
import sys

path = sys.argv[1]
image = Cocoa.NSImage.alloc().initWithContentsOfFile_(path)
if not image:
    sys.exit(1)

cgimage_ref = image.CGImageForProposedRect_context_hints_(None, None, None)
if not cgimage_ref:
    sys.exit(1)

cgimage = cgimage_ref[0]
request = Vision.VNRecognizeTextRequest.alloc().init()
request.setRecognitionLevel_(1)  # accurate
request.setUsesLanguageCorrection_(True)

handler = Vision.VNImageRequestHandler.alloc().initWithCGImage_options_(cgimage, None)
handler.performRequests_error_([request], None)

results = request.results()
if results:
    for obs in results:
        text = obs.topCandidates_(1)[0].string()
        print(text)
"#;

    let output = Command::new("python3")
        .args(["-c", ocr_script, tmp_str])
        .output()
        .map_err(|e| format!("OCR failed: {}", e))?;

    // Clean up screenshot
    let _ = std::fs::remove_file(&tmp_path);

    if output.status.success() {
        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if text.is_empty() {
            return Err("No text found in screenshot".to_string());
        }
        Ok(OcrResult {
            text,
            source: if region { "region".into() } else { "fullscreen".into() },
        })
    } else {
        // Fallback: try using the simpler `shortcuts` approach or just return the error
        let stderr = String::from_utf8_lossy(&output.stderr);

        // Fallback to a simpler macOS approach using osascript
        let fallback = Command::new("osascript")
            .args([
                "-e",
                &format!(
                    r#"use framework "Vision"
use framework "AppKit"
set imagePath to "{}"
set theImage to current application's NSImage's alloc()'s initWithContentsOfFile:imagePath
set requestHandler to current application's VNImageRequestHandler's alloc()'s initWithData:(theImage's TIFFRepresentation()) options:(current application's NSDictionary's dictionary())
set theRequest to current application's VNRecognizeTextRequest's alloc()'s init()
theRequest's setRecognitionLevel:1
requestHandler's performRequests:{{theRequest}} |error|:(missing value)
set theResults to theRequest's results()
set theText to ""
repeat with obs in theResults
    set theText to theText & ((obs's topCandidates:1)'s first item's |string|() as text) & linefeed
end repeat
return theText"#,
                    tmp_str
                ),
            ])
            .output();

        match fallback {
            Ok(fb_out) if fb_out.status.success() => {
                let text = String::from_utf8_lossy(&fb_out.stdout).trim().to_string();
                Ok(OcrResult {
                    text,
                    source: if region { "region".into() } else { "fullscreen".into() },
                })
            }
            _ => Err(format!("OCR failed: {}", stderr))
        }
    }
}
