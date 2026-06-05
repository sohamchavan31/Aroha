from flask import Blueprint, request, jsonify
from services.ollama import generate

chat_bp = Blueprint("chat", __name__)

_SYSTEM = (
    "You are Aroha's AI fitness coach — motivational, knowledgeable, and concise. "
    "Help with exercise advice, workout tips, form guidance, and motivation. "
    "Keep answers under 150 words. Be direct and energetic."
)


@chat_bp.post("/ai/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"error": "message is required"}), 400

    try:
        reply = generate(message, _SYSTEM)
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 502
