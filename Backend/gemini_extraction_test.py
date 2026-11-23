import os, json, asyncio
from pathlib import Path
import httpx
from dotenv import load_dotenv

# Load environment variables from Backend/.env
backend_dir = Path(__file__).resolve().parent
load_dotenv(dotenv_path=backend_dir / '.env')

# Create a minimal PDF file (simple text) for testing
pdf_path = backend_dir / 'test_sample.pdf'
if not pdf_path.exists():
    # Write a simple PDF header with a text string (not a valid PDF but serves for test)
    pdf_path.write_bytes(b'%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')

# Endpoint configuration
base_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
# Assuming VITE_API_BASE_URL is /api, the backend is proxied at http://localhost:5173/api
api_url = f'http://127.0.0.1:5000/api/ai/analyze-file'

async def main():
    result = {}
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Health check first
            health_resp = await client.get('http://127.0.0.1:5000/api/health')
            result['health_status'] = health_resp.status_code
            # Upload file for analysis
            with open(pdf_path, 'rb') as f:
                files = {'file': ('test_sample.pdf', f, 'application/pdf')}
                data = {'question': 'Extract all relevant information from this document.'}
                resp = await client.post(api_url, files=files, data=data)
                result['status_code'] = resp.status_code
                try:
                    result['json'] = resp.json()
                except Exception:
                    result['text'] = resp.text
    except Exception as e:
        result['exception'] = str(e)

    # Write sanitized result to artifacts
    out_path = Path(__file__).with_name('gemini_extraction_test_output.json')
    with open(out_path, 'w', encoding='utf-8') as out_f:
        json.dump(result, out_f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    asyncio.run(main())
