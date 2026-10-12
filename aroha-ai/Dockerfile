# Aroha AI — Flask behind gunicorn. Talks to Ollama at OLLAMA_URL.
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn==23.0.0

COPY . .
RUN useradd --system aroha && chown -R aroha /app
USER aroha

EXPOSE 5000
# Replies can take a while on CPU, so give each request up to 3 minutes.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "180", "app:create_app()"]
