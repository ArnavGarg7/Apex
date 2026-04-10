import requests

BASE = "http://localhost:8001/api"
HEADERS = {"Authorization": "Bearer dummy-token"}

endpoints = [
    "/standings/2025",
    "/calendar/2025",
    "/circuit/bahrain/history",
    "/circuit/bahrain/topology",
    "/weather/bahrain",
    "/news/latest",
    "/historical/drivers"
]

for ep in endpoints:
    url = f"{BASE}{ep}"
    print(f"Fetching {url}... ", end="", flush=True)
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        print(f"Status: {res.status_code}")
        if res.status_code != 200:
            print(f"  Response: {res.text[:200]}")
    except Exception as e:
        print(f"Exception: {e}")
