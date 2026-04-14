# APEX F1 Intelligence Dashboard - Deployment Guide

This guide covers the production deployment of APEX v3.0 using Docker.

## Prerequisites

1. **Docker Desktop**: [Download and install](https://www.docker.com/products/docker-desktop/) if running locally. If on Linux/Cloud, install `docker` and `docker-compose`.
2. **API Keys**: Ensure your `.env` file in the root directory contains valid keys for:
   - `GEMINI_API_KEY` (Gemini 2.0 Flash)
   - `OPENWEATHER_API_KEY` (For live track weather)
3. **Firebase**: Ensure your Firebase Service Account JSON is in the root directory.

## Configuration

Prepare your `.env` file based on `.env.example`. Most importantly, ensure the path to your Firebase JSON is correct:

```bash
FIREBASE_SERVICE_ACCOUNT_PATH=./your-service-account-file.json
GEMINI_API_KEY=AIza...
OPENWEATHER_API_KEY=20...
```

## Launching the Dashboard

Open a terminal in the project root and run:

```powershell
# Build and start the containers in the background
docker compose up --build -d
```

### Accessing the App
- **Dashboard**: `http://localhost:80` (or just `localhost`)
- **Backend API**: `http://localhost:8001/api/health`

## Maintenance Commands

| Action | Command |
| :--- | :--- |
| **View Logs** | `docker compose logs -f` |
| **Stop App** | `docker compose down` |
| **Update App** | `git pull && docker compose up --build -d` |
| **Reset Data** | `rm -rf ./data` |

## Troubleshooting

- **502 Bad Gateway**: This usually means the backend is still booting up (FastF1 is warming up its cache). Wait 30-40 seconds and refresh.
- **Port Conflict**: If port 80 or 8001 is already in use, change the mapping in `docker-compose.yml`.
- **Firebase Errors**: Ensure the JSON file name in your directory matches exactly what is in the `.env`.

---
*Developed by Arnav Garg*
