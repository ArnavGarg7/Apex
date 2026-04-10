"""
scripts/export_training_data.py
Read all cached FastF1 race sessions and export a consolidated training CSV.

Usage:
  python scripts/export_training_data.py
  python scripts/export_training_data.py --start-year 2022 --end-year 2024
"""
import os
import sys
import argparse
import logging
import pandas as pd
import fastf1

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ml.features import engineer_features, encode_circuit_id

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

CACHE_DIR = os.getenv('FASTF1_CACHE_DIR', './data/cache')
OUTPUT_DIR = './data/processed'
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'training_data.csv')

PIT_LOSS_BY_CIRCUIT = {
    'monaco': 24.0,
    'singapore': 23.0,
    'abu_dhabi': 20.0,
    'bahrain': 22.0,
    'default': 22.0,
}


def circuit_key(event_name: str) -> str:
    return event_name.lower().replace(' ', '_').replace('grand_prix', '').strip(' _')


def get_pit_loss(circuit_id: str) -> float:
    return PIT_LOSS_BY_CIRCUIT.get(circuit_id, PIT_LOSS_BY_CIRCUIT['default'])


def process_session(session) -> pd.DataFrame:
    laps = session.laps
    if laps is None or laps.empty:
        return pd.DataFrame()

    circuit_id = circuit_key(str(session.event.get('EventName', 'unknown')))
    total_laps = int(laps['LapNumber'].max())
    pit_loss = get_pit_loss(circuit_id)
    circuit_id_enc = encode_circuit_id(circuit_id)

    all_frames = []
    for driver in laps['Driver'].unique():
        driver_laps = laps[laps['Driver'] == driver].copy()
        if len(driver_laps) < 5:
            continue
        try:
            feat_df = engineer_features(driver_laps, circuit_id, total_laps, pit_loss)
            feat_df['year'] = session.date.year
            feat_df['driver'] = driver
            feat_df['circuit_id'] = circuit_id
            feat_df['circuit_id_enc'] = circuit_id_enc
            all_frames.append(feat_df)
        except Exception as e:
            logger.debug(f"    Driver {driver} failed: {e}")

    if all_frames:
        return pd.concat(all_frames, ignore_index=True)
    return pd.DataFrame()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--start-year', type=int, default=2018)
    parser.add_argument('--end-year', type=int, default=2024)
    args = parser.parse_args()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    fastf1.Cache.enable_cache(CACHE_DIR)

    all_data = []

    for year in range(args.start_year, args.end_year + 1):
        try:
            schedule = fastf1.get_event_schedule(year, include_testing=False)
        except Exception as e:
            logger.warning(f"Could not fetch schedule for {year}: {e}")
            continue

        for _, event in schedule.iterrows():
            round_num = event['RoundNumber']
            marker = os.path.join(CACHE_DIR, f'.done_{year}_{round_num}_R')
            if not os.path.exists(marker):
                logger.info(f"  [{year} R{round_num}] Not cached, skipping — run fetch_history.py first")
                continue

            try:
                logger.info(f"  [{year} R{round_num}] {event.get('EventName', '')} — processing...")
                session = fastf1.get_session(year, round_num, 'R')
                session.load(laps=True, telemetry=False, weather=False, messages=False)
                df = process_session(session)
                if not df.empty:
                    all_data.append(df)
                    logger.info(f"    → {len(df)} rows")
            except Exception as e:
                logger.warning(f"  [{year} R{round_num}] FAILED: {e}")

    if not all_data:
        logger.error("No data collected. Have you run fetch_history.py?")
        return

    final = pd.concat(all_data, ignore_index=True)
    final.to_csv(OUTPUT_FILE, index=False)
    logger.info(f"Exported {len(final)} rows to {OUTPUT_FILE}")


if __name__ == '__main__':
    main()
