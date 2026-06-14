$ErrorActionPreference = "Stop"

Write-Host "Starting F1 Circuit Telemetry Generator..." -ForegroundColor Cyan
Write-Host "This will fetch the remaining missing circuits from OpenF1."

# Run the python generator script
python -c "
import json
import logging
from backend.services.fastf1_service import get_circuit_topology_by_id, get_circuit_heatmap, get_circuit_history, CIRCUIT_GP_MAP
import os

filepath = 'frontend/public/data/circuits.json'
os.makedirs('frontend/public/data', exist_ok=True)

# Load existing data so we don't overwrite the 16 working circuits
if os.path.exists(filepath):
    with open(filepath, 'r') as f:
        all_data = json.load(f)
else:
    all_data = {}

missing_count = 0

for circuit_id in CIRCUIT_GP_MAP.keys():
    # Only fetch if we don't already have valid topology data for this circuit
    if circuit_id not in all_data or not all_data[circuit_id].get('topology'):
        print(f'Fetching missing data for: {circuit_id}...')
        try:
            all_data[circuit_id] = {
                'topology': get_circuit_topology_by_id(circuit_id),
                'heatmap': get_circuit_heatmap(circuit_id),
                'history': get_circuit_history(circuit_id)
            }
            missing_count += 1
            print(f'Successfully fetched {circuit_id}!')
        except Exception as e:
            print(f'Failed to fetch {circuit_id}: {e}')

if missing_count > 0:
    with open(filepath, 'w') as f:
        json.dump(all_data, f)
    print(f'\nUpdate complete! {missing_count} new circuits added.')
else:
    print('\nAll circuits are already present. Nothing to update.')
"

Write-Host "`nRebuilding and deploying the frontend to Firebase..." -ForegroundColor Cyan
cd frontend
npm run build
firebase deploy --only hosting

Write-Host "`nAll done! Your site is now updated with the remaining circuits." -ForegroundColor Green
