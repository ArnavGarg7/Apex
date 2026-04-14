FROM python:3.11-slim

WORKDIR /app

# Install build deps and curl (needed for Docker healthcheck)
RUN apt-get update && apt-get install -y gcc g++ curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Install in two stages: heavy scientific packages first (larger downloads), then the rest.
# --timeout 300 and --retries 5 handle slow/flaky PyPI connections.
RUN pip install --no-cache-dir --timeout 300 --retries 5 \
        numpy pandas scipy scikit-learn xgboost shap fastf1
RUN pip install --no-cache-dir --timeout 120 --retries 5 \
        -r requirements.txt gunicorn

# We map the root project dir to /app so `backend` package can be resolved
COPY backend/ ./backend/
COPY ml/ ./ml/
COPY gunicorn_conf.py .

# Ensure data directory exists for caches and models
RUN mkdir -p /app/data

# Cloud Run uses the $PORT env var. We default to 8080.
ENV PORT=8080
EXPOSE $PORT

CMD ["sh", "-c", "gunicorn -k uvicorn.workers.UvicornWorker -c gunicorn_conf.py --bind 0.0.0.0:$PORT backend.main:app"]
