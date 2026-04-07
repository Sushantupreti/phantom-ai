use std::process::Command;

/// Extract text from a PDF file using macOS native tools
pub fn extract_pdf_text(path: &str) -> Result<String, String> {
    // Try textutil first (macOS built-in, handles many formats)
    let result = Command::new("textutil")
        .args(["-convert", "txt", "-stdout", path])
        .output();

    if let Ok(out) = result {
        if out.status.success() {
            let text = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !text.is_empty() {
                return Ok(text);
            }
        }
    }

    // Fallback: try mdimport metadata extraction
    let result = Command::new("mdimport")
        .args(["-d1", path])
        .output();

    if let Ok(out) = result {
        if out.status.success() {
            let text = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !text.is_empty() {
                return Ok(text);
            }
        }
    }

    // Fallback: use python with PyPDF2 or pdfplumber
    let py_script = format!(
        r#"
import subprocess, sys
try:
    result = subprocess.run(['pdftotext', '{}', '-'], capture_output=True, text=True)
    if result.returncode == 0 and result.stdout.strip():
        print(result.stdout.strip())
        sys.exit(0)
except: pass

# Try with python pdf reader
try:
    import fitz  # PyMuPDF
    doc = fitz.open('{}')
    text = ''
    for page in doc:
        text += page.get_text()
    print(text.strip())
except:
    # Last resort: use Quartz (macOS native)
    try:
        from Quartz import PDFDocument
        from Foundation import NSURL
        url = NSURL.fileURLWithPath_('{}')
        pdf = PDFDocument.alloc().initWithURL_(url)
        if pdf:
            text = ''
            for i in range(pdf.pageCount()):
                page = pdf.pageAtIndex_(i)
                text += page.string() or ''
            print(text.strip())
    except Exception as e:
        print(f'Error: {{e}}', file=sys.stderr)
        sys.exit(1)
"#,
        path, path, path
    );

    let output = Command::new("python3")
        .args(["-c", &py_script])
        .output()
        .map_err(|e| format!("PDF extraction failed: {}", e))?;

    if output.status.success() {
        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !text.is_empty() {
            return Ok(text);
        }
    }

    Err("Could not extract text from PDF. Try uploading a .txt file instead.".to_string())
}

/// Fetch text content from a URL (for company research)
pub fn fetch_url_text(url: &str) -> Result<String, String> {
    let output = Command::new("curl")
        .args([
            "-sL",
            "--max-time", "10",
            "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            url,
        ])
        .output()
        .map_err(|e| format!("Failed to fetch URL: {}", e))?;

    if !output.status.success() {
        return Err("Failed to fetch URL".to_string());
    }

    let html = String::from_utf8_lossy(&output.stdout).to_string();

    // Extract text from HTML using python
    let py_script = format!(
        r#"
import sys, re
html = sys.stdin.read()
# Remove script and style tags
html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
# Remove HTML tags
text = re.sub(r'<[^>]+>', ' ', html)
# Clean whitespace
text = re.sub(r'\s+', ' ', text).strip()
# Limit to 3000 chars
print(text[:3000])
"#
    );

    let py_out = Command::new("python3")
        .args(["-c", &py_script])
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .spawn()
        .and_then(|mut child| {
            use std::io::Write;
            if let Some(ref mut stdin) = child.stdin {
                let _ = stdin.write_all(html.as_bytes());
            }
            child.wait_with_output()
        })
        .map_err(|e| format!("Text extraction failed: {}", e))?;

    let text = String::from_utf8_lossy(&py_out.stdout).trim().to_string();
    if text.is_empty() {
        return Err("No text content found at URL".to_string());
    }
    Ok(text)
}
