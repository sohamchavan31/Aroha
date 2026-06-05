from flask import Blueprint, request, jsonify
from services.ollama import generate

insights_bp = Blueprint("insights", __name__)

_SYSTEM = (
    "You are Aroha's AI wellness analyst. "
    "Analyse the user's habit and nutrition data and give 2-3 specific, actionable insights. "
    "Be brief, encouraging, and practical."
)


@insights_bp.post("/ai/insights")
def insights():
    data = request.get_json(silent=True) or {}

    habits       = data.get("habits", [])
    nutrition    = data.get("nutritionSummary", {})
    goal         = data.get("goal", "stay_fit")
    consistency  = data.get("consistencyScore", 0)

    habits_str = ", ".join(habits) if habits else "none tracked"
    nutrition_str = (
        f"{nutrition.get('calories', '?')} kcal | "
        f"P:{nutrition.get('protein', '?')}g C:{nutrition.get('carbs', '?')}g F:{nutrition.get('fat', '?')}g"
        if nutrition else "no data"
    )

    prompt = (
        f"User wellness snapshot:\n"
        f"- Goal: {goal}\n"
        f"- Consistency score: {consistency}%\n"
        f"- Active habits: {habits_str}\n"
        f"- Today's nutrition: {nutrition_str}\n\n"
        "Give 2-3 specific, actionable insights to help them improve."
    )

    try:
        result = generate(prompt, _SYSTEM)
        return jsonify({"insights": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 502
