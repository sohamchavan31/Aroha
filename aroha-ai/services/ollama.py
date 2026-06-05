import os
import requests

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


def generate(prompt: str, system: str = "") -> str:
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "system": system,
        "stream": False,
    }
    res = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json=payload,
        timeout=120,
    )
    res.raise_for_status()
    return res.json().get("response", "")
