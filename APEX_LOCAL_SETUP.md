# APEX — Local Setup (relay + historical agent)

F1 blocks Cloud Run's datacenter IP, so the pieces that talk to F1 must run on
your home connection. This is a **one-time setup**; after it, a race day is one
command (or zero, if you enable auto-start).

- **Live relay** (`f1_local_relay.py`) — feeds the real-time timing board.
- **Historical agent** (`f1_local_agent.py`) — powers Compare, Pre-Race, heatmaps.
- **cloudflared tunnel** — gives the cloud backend a way to reach the agent.

---

## 1. One-time install

```powershell
# Python deps (from the repo root)
pip install fastf1 fastapi uvicorn signalrcore requests

# cloudflared (pick one)
winget install --id Cloudflare.cloudflared
#   or: choco install cloudflared
```

## 2. One-time config

```powershell
Copy-Item apex.local.ps1.example apex.local.ps1
# then edit apex.local.ps1 and set $env:LIVE_INGEST_SECRET to the SAME secret
# you deployed to the backend (LIVE_INGEST_SECRET). This file is gitignored.
```

## 3. Named tunnel — do this once, never redeploy again (recommended)

A **quick** tunnel (`cloudflared tunnel --url ...`) gives a *random* URL each run,
which forces a backend redeploy every time. A **named** tunnel gives a permanent
URL. You need a domain on Cloudflare (free plan is fine).

```powershell
cloudflared login                                   # authorize in browser
cloudflared tunnel create apex-agent                # creates the tunnel + a creds file
cloudflared tunnel route dns apex-agent apex-agent.yourdomain.com   # permanent hostname
```

Create `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: apex-agent
credentials-file: C:\Users\<you>\.cloudflared\<tunnel-id>.json
ingress:
  - hostname: apex-agent.yourdomain.com
    service: http://localhost:8100
  - service: http_status:404
```

Then in `apex.local.ps1` uncomment:
```powershell
$env:APEX_TUNNEL_NAME = "apex-agent"
```

Finally, point the backend at the permanent URL **once**:
```powershell
$env:LIVE_INGEST_SECRET      = "<your secret>"
$env:HISTORICAL_UPSTREAM_URL = "https://apex-agent.yourdomain.com"
.\deploy_cloud.ps1
```

> No domain / don't want to bother? Skip this section. `start_apex.ps1` will use a
> quick tunnel and remind you to copy its URL into `HISTORICAL_UPSTREAM_URL` and
> redeploy each session.

---

## 4. Every race day (the whole point)

```powershell
.\start_apex.ps1            # relay + agent + tunnel, each in its own window
```

Other modes:
```powershell
.\start_apex.ps1 -Mode Live   # just the live timing relay
.\start_apex.ps1 -Mode Hist   # just Compare / Pre-Race (agent + tunnel)
```

Close a window to stop that piece. With a **named** tunnel, that's it — nothing to
redeploy.

---

## 5. Optional — auto-start when your PC boots (zero clicks)

Register a scheduled task that runs the launcher at logon:

```powershell
$action  = New-ScheduledTaskAction -Execute "powershell.exe" `
           -Argument "-NoProfile -WindowStyle Hidden -File `"$PWD\start_apex.ps1`""
$trigger = New-ScheduledTaskTrigger -AtLogOn
Register-ScheduledTask -TaskName "APEX Local" -Action $action -Trigger $trigger `
           -Description "Starts APEX live relay + historical agent + tunnel"
```

Remove it later with:
```powershell
Unregister-ScheduledTask -TaskName "APEX Local" -Confirm:$false
```

As long as your machine is on and online, live + historical data flow with no
manual step.

---

## Quick sanity checks

```powershell
# agent up locally?
curl http://localhost:8100/api/health

# backend reaching the agent? (after setting HISTORICAL_UPSTREAM_URL + redeploy)
#   open the Compare page — dropdowns should fill with drivers.

# relay feeding? watch the "APEX Live Relay" window for
#   "Connected to F1 live timing stream" + "Forwarded initial snapshot".
```
