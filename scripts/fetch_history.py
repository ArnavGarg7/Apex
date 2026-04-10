"""
scripts/fetch_history.py
Bulk-fetch FastF1 data for 2018-2024, saving to cache directory.
Resumable: skips already-cached sessions.

Usage:
  python scripts/fetch_history.py
  python scripts/fetch_history.py --start-year 2022 --end-year 2024
"""
import os
import argparse
import logging
import fastf1

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

CACHE_DIR = os.getenv('FASTF1_CACHE_DIR', './data/cache')
SESSION_TYPES = ['R']  # Race sessions; add 'Q', 'S', 'FP1' etc. if needed


def fetch_season(year: int, force: bool = False):
    schedule = fastf1.get_event_schedule(year, include_testing=False)
    logger.info(f"Season {year}: {len(schedule)} events")

    for _, event in schedule.iterrows():
        round_number = event['RoundNumber']
        event_name = event.get('EventName', f'Round {round_number}')

        for session_type in SESSION_TYPES:
            marker_path = os.path.join(CACHE_DIR, f'.done_{year}_{round_number}_{session_type}')
            if not force and os.path.exists(marker_path):
                logger.info(f"  [{year} R{round_number}] {event_name} — {session_type}: already cached, skipping")
                continue

            try:
                logger.info(f"  [{year} R{round_number}] {event_name} — {session_type}: fetching...")
                session = fastf1.get_session(year, round_number, session_type)
                session.load(laps=True, telemetry=False, weather=True, messages=False)
                # Touch marker
                with open(marker_path, 'w') as f:
                    f.write('done')
                logger.info(f"  [{year} R{round_number}] {event_name} — {session_type}: ✓ saved")
            except Exception as e:
                logger.warning(f"  [{year} R{round_number}] {event_name} — {session_type}: FAILED — {e}")


def main():
    parser = argparse.ArgumentParser(description='Fetch FastF1 historical data')
    parser.add_argument('--start-year', type=int, default=2018)
    parser.add_argument('--end-year', type=int, default=2025)
    parser.add_argument('--force', action='store_true', help='Re-download even if cached')
    args = parser.parse_args()

    os.makedirs(CACHE_DIR, exist_ok=True)
    fastf1.Cache.enable_cache(CACHE_DIR)

    for year in range(args.start_year, args.end_year + 1):
        fetch_season(year, force=args.force)

    logger.info("All done!")


if __name__ == '__main__':
    main()
