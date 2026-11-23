import os
import json
import asyncio
from pathlib import Path
import httpx
from dotenv import load_dotenv

# Load .env from Backend directory
backend_dir = Path(__file__).resolve().parent
load_dotenv(dotenv_path=backend_dir / '.env')

# Test user credentials (ensure unique)
TEST_EMAIL = os.getenv('TEST_USER_EMAIL', 'testuser@example.com')
TEST_PASSWORD = os.getenv('TEST_USER_PASSWORD', 'TestPass123!')

API_BASE = 'http://127.0.0.1:5000'

async def signup(client: httpx.AsyncClient):
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "confirmPassword": TEST_PASSWORD,
        "fullName": "Test User",
        "mobile": "+919876543210"
    }
    try:
        resp = await client.post(f"{API_BASE}/api/auth/signup", json=payload)
        return resp
    except Exception as e:
        return e

async def login(client: httpx.AsyncClient):
    payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
    resp = await client.post(f"{API_BASE}/api/auth/login", json=payload)
    return resp

async def analyze_file(client: httpx.AsyncClient, token: str, file_path: Path):
    headers = {"Authorization": f"Bearer {token}"}
    data = {"question": "Extract all relevant information from this document."}
    files = {"file": (file_path.name, open(file_path, 'rb'), "application/pdf")}
    resp = await client.post(f"{API_BASE}/api/ai/analyze-file", headers=headers, data=data, files=files)
    return resp

async def main():
    result = {}
    # Ensure a simple PDF exists for testing
    pdf_path = backend_dir / 'test_sample.pdf'
    if not pdf_path.exists():
        # Minimal valid PDF content (one page with text "Test")
        pdf_path.write_bytes(b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R]>>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R>>\nendobj\n4 0 obj\n<< /Length 55>>\nstream\nBT /F1 24 Tf 100 100 Td (Test) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000218 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n320\n%%EOF')
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Health check
        health = await client.get(f"{API_BASE}/api/health")
        result['health_status'] = health.status_code
        # Signup (ignore if already exists)
        signup_resp = await signup(client)
        result['signup_status'] = getattr(signup_resp, 'status_code', None)
        # Login to obtain token
        login_resp = await login(client)
        if login_resp.status_code == 200:
            token = login_resp.json().get('accessToken') or login_resp.json().get('token')
            result['login_status'] = 200
        else:
            result['login_status'] = login_resp.status_code
            token = None
        # If logged in, test extraction
        if token:
            extract_resp = await analyze_file(client, token, pdf_path)
            result['extract_status'] = extract_resp.status_code
            try:
                result['extract_json'] = extract_resp.json()
            except Exception:
                result['extract_text'] = extract_resp.text
        else:
            result['extract_status'] = 'no_token'
        # Write result to artifact file
        out_path = backend_dir / 'gemini_extraction_test_full_output.json'
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    asyncio.run(main())
