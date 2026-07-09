import os

from flask import Flask, jsonify, request
from dotenv import load_dotenv

load_dotenv()

# Shared secret the Spring backend must send on every request — keeps this
# internal service from being callable directly by anyone who can reach it.
INTERNAL_KEY = os.getenv("AI_INTERNAL_KEY")


def create_app():
    app = Flask(__name__)

    from routes.meal_plan import meal_plan_bp
    from routes.chat import chat_bp
    from routes.insights import insights_bp

    app.register_blueprint(meal_plan_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(insights_bp)

    @app.before_request
    def check_internal_key():
        if request.path == "/health":
            return None
        if not INTERNAL_KEY:
            return None
        if request.headers.get("X-Internal-Key") != INTERNAL_KEY:
            return jsonify({"error": "unauthorized"}), 401

    @app.errorhandler(Exception)
    def handle_unexpected_error(err):
        app.logger.exception("Unhandled error")
        return jsonify({"error": "internal error"}), 500

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "aroha-ai"}

    return app


if __name__ == "__main__":
    debug = os.getenv("FLASK_ENV") == "development"
    app = create_app()
    app.run(debug=debug, port=5000)
