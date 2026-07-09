import os
import requests

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

# Hard cap on any free-text field we drop into a prompt — keeps payloads
# small and limits how much room there is for prompt-injection text.
MAX_INPUT_LEN = 500


def clamp_text(value: str, max_len: int = MAX_INPUT_LEN) -> str:
    return str(value).strip()[:max_len]


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
