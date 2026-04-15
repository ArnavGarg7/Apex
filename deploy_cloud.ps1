# APEX F1 Dashboard — Google Cloud Deployment Automation (FIXED)
# This script ensures the backend is built correctly and linked to the frontend.

$ErrorActionPreference = "Stop"

$PROJECT_ID = "apex-92c8d"
$REGION = "us-central1"
$BACKEND_SERVICE = "apex-backend"
$JSON_FILE = "apex-92c8d-firebase-adminsdk-fbsvc-e6f2448e04.json"

Write-Host "--- 1. Initializing Google Cloud ---" -ForegroundColor Cyan
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

Write-Host "--- 2. Building Backend Image ---" -ForegroundColor Cyan
# Cloud Build requires a file named 'Dockerfile'. We temporarily rename ours.
Move-Item "backend.Dockerfile" "Dockerfile"
try {
    gcloud builds submit --tag "gcr.io/$PROJECT_ID/$BACKEND_SERVICE" .
} finally {
    # Always rename back to avoid breaking local dev
    Move-Item "Dockerfile" "backend.Dockerfile"
}

Write-Host "--- 3. Deploying to Cloud Run ---" -ForegroundColor Cyan
# Cloud Run CLI fails parsing JSON via inline flags. We build a temporary env.yaml
$JSON_CONTENT = (Get-Content $JSON_FILE -Raw).Replace("`r", "")
$yaml = "APP_ENV: production`nFIREBASE_CREDENTIALS_JSON: |`n  " + $JSON_CONTENT.Replace("`n", "`n  ") + "`nGEMINI_API_KEY: `"AIzaSyDdACfUG0biuz_4KvaEwrNwcg-hKJQs2Rs`"`nOPENWEATHER_API_KEY: `"20141e6e704c122e5cfc91f3f968ea2f`"`n"
Set-Content env.yaml $yaml

try {
    gcloud run deploy $BACKEND_SERVICE `
      --image "gcr.io/$PROJECT_ID/$BACKEND_SERVICE" `
      --platform managed `
      --region $REGION `
      --allow-unauthenticated `
      --memory 2Gi `
      --cpu 1 `
      --env-vars-file env.yaml
} finally {
    Remove-Item env.yaml -ErrorAction SilentlyContinue
}

# Capture the official URL
$BACKEND_URL = gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)'
Write-Host "Backend is LIVE at: $BACKEND_URL" -ForegroundColor Green

Write-Host "--- 4. Building Frontend ---" -ForegroundColor Cyan
if (Test-Path "frontend") {
    Push-Location frontend
    # Inject the backend URL into the build
    $env:VITE_API_BASE_URL = $BACKEND_URL
    npm install
    npm run build
    Pop-Location
} else {
    Write-Error "Frontend directory not found!"
}

Write-Host "--- 5. Deploying to Firebase Hosting ---" -ForegroundColor Cyan
firebase deploy --only hosting --project $PROJECT_ID

Write-Host "--- DEPLOYMENT COMPLETE! ---" -ForegroundColor Green
Write-Host "Your app is now fully functional at: https://$PROJECT_ID.web.app" -ForegroundColor Yellow
