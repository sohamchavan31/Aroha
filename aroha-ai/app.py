from flask import Flask
from dotenv import load_dotenv

load_dotenv()


def create_app():
    app = Flask(__name__)

    from routes.meal_plan import meal_plan_bp
    from routes.chat import chat_bp
    from routes.insights import insights_bp

    app.register_blueprint(meal_plan_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(insights_bp)

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "aroha-ai"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
