import subprocess
import sys
import time
import httpx
import asyncio

def start_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=r"C:\Users\Vansh Kaushal\OneDrive\Desktop\CODE\aa",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    return proc

async def test_chat():
    await asyncio.sleep(2)  # Wait for server
    
    try:
        resp = httpx.post('http://127.0.0.1:8000/api/chat', 
                         json={'message': 'What is AI?', 'user_id': 'test'}, 
                         timeout=60)
        data = resp.json()
        print(f"Provider: {data.get('provider')}")
        print(f"Response: {data.get('response')}")
        print(f"Fallback: {data.get('fallback_triggered')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Starting API server...")
    start_server()
    print("Server started at http://127.0.0.1:8000")
    print("Testing chat endpoint...")
    asyncio.run(test_chat())