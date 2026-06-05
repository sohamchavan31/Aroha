from flask import Blueprint, request, jsonify
from services.ollama import generate

meal_plan_bp = Blueprint("meal_plan", __name__)

_SYSTEM = (
    "You are Aroha's AI nutrition coach specialising in Indian cuisine. "
    "Provide practical, healthy Indian meal plans based on the user's macros and goal. "
    "Use real Indian food names. Be concise and structured."
)


@meal_plan_bp.post("/ai/meal-plan")
def meal_plan():
    data = request.get_json(silent=True) or {}

    calories = data.get("calories", 2000)
    protein  = data.get("protein", 150)
    carbs    = data.get("carbs", 200)
    fat      = data.get("fat", 65)
    region   = data.get("region", "Indian")
    goal     = data.get("goal", "stay_fit")

    prompt = (
        f"Create a 1-day {region} meal plan for these daily targets:\n"
        f"- Calories: {calories} kcal\n"
        f"- Protein: {protein}g | Carbs: {carbs}g | Fat: {fat}g\n"
        f"- Goal: {goal}\n\n"
        "Include breakfast, lunch, dinner, and 1 snack. "
        "List each meal with approximate macros."
    )

    try:
        result = generate(prompt, _SYSTEM)
        return jsonify({"mealPlan": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 502
