<#
  start_apex.ps1 - APEX race-day launcher
  ----------------------------------------------------------------------------
  Starts the pieces that must run on your (non-blocked) residential IP:
    * Live relay       (f1_local_relay.py)  -> real-time timing board
    * Historical agent (f1_local_agent.py)  -> Compare + Pre-Race + heatmaps
    * cloudflared tunnel                     -> lets the cloud backend reach the agent

  Each runs in its own window so you can watch its logs. Close a window to stop it.

  Usage:
    .\start_apex.ps1              # all three (default)
    .\start_apex.ps1 -Mode Live   # live relay only
    .\start_apex.ps1 -Mode Hist   # historical agent + tunnel only

  Config: copy apex.local.ps1.example -> apex.local.ps1 and fill in your secret.
  One-time named-tunnel + auto-start setup: see APEX_LOCAL_SETUP.md
#>
param(
    [ValidateSet('All', 'Live', 'Hist')]
    [string]$Mode = 'All'
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

# Load local config (secret, tunnel name, backend URL)
$cfg = Join-Path $root 'apex.local.ps1'
if (Test-Path $cfg) {
    . $cfg
} else {
    Write-Host "No apex.local.ps1 found - copy apex.local.ps1.example to apex.local.ps1 and fill it in." -ForegroundColor Yellow
}

if (-not $env:LIVE_INGEST_SECRET) {
    Write-Error "LIVE_INGEST_SECRET is not set (set it in apex.local.ps1). Aborting."
}

# Defaults (child windows inherit these env vars)
if (-not $env:APEX_BACKEND_URL) { $env:APEX_BACKEND_URL = 'https://apex-backend-uqtw7bvyla-uc.a.run.app' }
if (-not $env:AGENT_PORT)       { $env:AGENT_PORT = '8100' }
$port = $env:AGENT_PORT

function Start-Win([string]$title, [string]$cmd) {
    # Child powershell inherits the current process env (secret, port, backend url).
    # Build the inner command by concatenation to avoid quote/escape headaches.
    $inner = '$Host.UI.RawUI.WindowTitle = ' + "'$title'; " + $cmd
    Start-Process powershell -WorkingDirectory $root -ArgumentList '-NoExit', '-Command', $inner
    Write-Host "  started -> $title" -ForegroundColor Green
}

Write-Host "APEX launcher (mode: $Mode)" -ForegroundColor Cyan
Write-Host "  backend: $env:APEX_BACKEND_URL" -ForegroundColor DarkGray

# Resolve cloudflared even if it isn't on PATH (winget installs to a non-PATH dir)
function Resolve-Cloudflared {
    $c = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
    if ($c) { return $c }
    foreach ($cand in @(
        "$env:ProgramFiles\cloudflared\cloudflared.exe",
        "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe",
        "$env:LOCALAPPDATA\Microsoft\WinGet\Links\cloudflared.exe"
    )) { if (Test-Path $cand) { return $cand } }
    return $null
}

# Historical agent + tunnel
if ($Mode -eq 'All' -or $Mode -eq 'Hist') {
    Start-Win 'APEX Historical Agent' 'python f1_local_agent.py'
    Start-Sleep -Seconds 2

    $cf = Resolve-Cloudflared
    if (-not $cf) {
        Write-Host "  cloudflared not found - tunnel NOT started. Install it, then re-run." -ForegroundColor Red
        Write-Host "    winget install --id Cloudflare.cloudflared" -ForegroundColor DarkGray
    } elseif ($env:APEX_TUNNEL_NAME) {
        Start-Win "APEX Tunnel [$env:APEX_TUNNEL_NAME]" ('& "' + $cf + '" tunnel run ' + $env:APEX_TUNNEL_NAME)
    } else {
        Write-Host "  no APEX_TUNNEL_NAME set -> quick tunnel (URL changes each run; needs a redeploy)" -ForegroundColor Yellow
        Start-Win 'APEX Tunnel [quick]' ('& "' + $cf + '" tunnel --url http://localhost:' + $port)
    }
}

# Live relay
if ($Mode -eq 'All' -or $Mode -eq 'Live') {
    Start-Win 'APEX Live Relay' 'python f1_local_relay.py'
}

Write-Host ""
Write-Host "Launched. Each piece is in its own window; close a window to stop that piece." -ForegroundColor Cyan
if (($Mode -ne 'Live') -and (-not $env:APEX_TUNNEL_NAME)) {
    Write-Host "ACTION: copy the https://<...>.trycloudflare.com URL from the tunnel window," -ForegroundColor Yellow
    Write-Host "        set HISTORICAL_UPSTREAM_URL to it on the backend, and redeploy." -ForegroundColor Yellow
    Write-Host "        (Set up a NAMED tunnel once to skip this forever - see APEX_LOCAL_SETUP.md)" -ForegroundColor DarkGray
}
