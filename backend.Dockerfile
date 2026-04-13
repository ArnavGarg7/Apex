FROM python:3.11-slim

WORKDIR /app

# Install build deps for fastf1/pandas/xgboost if needed
RUN apt-get update && apt-get install -y gcc g++ && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Ensure gunicorn is installed for production ASGI serving
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# We map the root project dir to /app so `backend` package can be resolved
COPY backend/ ./backend/
COPY ml/ ./ml/
COPY gunicorn_conf.py .

# Ensure data directory exists for caches and models
RUN mkdir -p /app/data

EXPOSE 8001

CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-c", "gunicorn_conf.py", "backend.main:app"]
