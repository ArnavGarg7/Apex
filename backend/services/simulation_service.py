"""
backend/services/simulation_service.py
Monte Carlo simulation for the F1 Drivers' and Constructors' Championships.
"""
import random
from backend.services.fastf1_service import get_standings

def simulate_championship(year: int, remaining_races: int = 5, iterations: int = 1000) -> dict:
    """
    Simulates the remainder of the F1 season using Monte Carlo.
    Returns the percentage probability of each driver and constructor winning the championship.
    """
    standings = get_standings(year)
    drivers = standings.get('drivers', [])
    constructors = standings.get('constructors', [])

    if not drivers:
        return {"drivers": [], "constructors": []}

    # Weighting based on current gaps to leader and wins (basic proxy for pace)
    def calculate_base_pace(item_list):
        pace = {}
        for idx, item in enumerate(item_list):
            # The higher the current position and more wins, the higher the weight
            # Points give the baseline.
            base_wt = max(0, float(item.get('points', 0))) + (item.get('wins', 0) * 15)
            # Add a slight randomized skew based on standing position
            pace[item.get('driver_code', item.get('team_name', f'UNK_{idx}'))] = base_wt + (100 / (item.get('position', len(item_list)) + 0.1))
        return pace

    drv_pace = calculate_base_pace(drivers)
    con_pace = calculate_base_pace(constructors)

    def run_monte_carlo(items, pace_dict, id_key, name_key):
        wins = {item[id_key]: 0 for item in items}
        
        # F1 standard points system
        points_system = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

        for _ in range(iterations):
            # Copy starting points
            sim_points = {item[id_key]: float(item.get('points', 0)) for item in items}
            
            for _r in range(remaining_races):
                # Add some randomness to pace for this specific race
                race_pace = {k: v * random.uniform(0.8, 1.2) for k, v in pace_dict.items()}
                # Sort by highest race pace
                sorted_results = sorted(race_pace.items(), key=lambda x: x[1], reverse=True)
                
                # Assign points to top 10
                for i, (k, _) in enumerate(sorted_results[:10]):
                    sim_points[k] += points_system[i]

            # Find the champion of this iteration
            champion = max(sim_points.items(), key=lambda x: x[1])[0]
            wins[champion] += 1
            
        # Calculate probabilities
        probs = []
        for item in items:
            code = item[id_key]
            prob = (wins[code] / iterations) * 100
            if prob > 0:
                probs.append({
                    id_key: code,
                    'name': item.get(name_key, code),
                    'current_points': item.get('points', 0),
                    'probability': round(prob, 1),
                    'color_ref': item.get('team_name', '')
                })
        
        # Sort by probability descending
        return sorted(probs, key=lambda x: x['probability'], reverse=True)

    driver_probs = run_monte_carlo(drivers, drv_pace, 'driver_code', 'driver_name')
    constructor_probs = run_monte_carlo(constructors, con_pace, 'team_name', 'team_name')

    return {
        "drivers": driver_probs,
        "constructors": constructor_probs,
        "iterations": iterations,
        "remaining_races_assumed": remaining_races
    }
