"""
ml/features.py
Feature engineering from FastF1 data for pit-stop prediction models.
"""
import pandas as pd
import numpy as np
from typing import Optional


COMPOUND_MAP = {
    'SOFT': 0,
    'MEDIUM': 1,
    'HARD': 2,
    'INTERMEDIATE': 3,
    'WET': 4,
    'UNKNOWN': -1,
}

TRACK_STATUS_MAP = {
    '1': 0,  # CLEAR
    '2': 1,  # YELLOW
    '3': 2,  # SC
    '4': 3,  # VSC
    '5': 4,  # RED FLAG
    '6': 5,  # VSC ENDING
    '7': 6,  # SC ENDING
}


def engineer_features(laps_df: pd.DataFrame, circuit_id: str, total_race_laps: int, pit_loss_avg: float = 22.0) -> pd.DataFrame:
    """
    Given a FastF1 laps DataFrame for a single driver in a single race,
    produce a feature-engineered DataFrame with one row per lap.

    Required columns in laps_df:
      - LapNumber, Compound, TyreLife, LapTime, TrackStatus, PitInTime, Stint
    """
    df = laps_df.copy()

    # ── Core identifiers ──────────────────────────────────────────────
    df['circuit_id'] = circuit_id
    df['total_race_laps'] = total_race_laps
    df['pit_loss_avg'] = pit_loss_avg

    # ── Compound encoding ─────────────────────────────────────────────
    df['compound_enc'] = df['Compound'].str.upper().map(COMPOUND_MAP).fillna(-1).astype(int)

    # ── Safety car lap flag ───────────────────────────────────────────
    df['sc_lap'] = (df['TrackStatus'].astype(str).isin(['3', '4', '6', '7'])).astype(int)

    # ── Lap time in seconds ───────────────────────────────────────────
    df['lap_time_s'] = df['LapTime'].dt.total_seconds()

    # ── Exclude SC laps from degradation calculation ──────────────────
    clean_laps = df[df['sc_lap'] == 0].copy()

    # Per-compound stint personal-best lap time
    compound_bests = (
        clean_laps.groupby(['Compound', 'Stint'])['lap_time_s']
        .min()
        .reset_index()
        .rename(columns={'lap_time_s': 'best_on_compound_stint'})
    )
    df = df.merge(compound_bests, on=['Compound', 'Stint'], how='left')
    df['lap_time_delta'] = df['lap_time_s'] - df['best_on_compound_stint']

    # ── Tyre age ──────────────────────────────────────────────────────
    df['tyre_age'] = df['TyreLife'].fillna(0).astype(int)

    # ── Gap ahead / behind (requires full-session merge, placeholder 0) ─
    # These are filled in by the route layer from OpenF1 timing data
    if 'gap_ahead' not in df.columns:
        df['gap_ahead'] = 0.0
    if 'gap_behind' not in df.columns:
        df['gap_behind'] = 0.0

    # ── Target: pitted on NEXT lap ───────────────────────────────────
    df['pitted_next_lap'] = df['PitInTime'].shift(-1).notna().astype(int)
    # Last lap never has a "next lap" → set to 0
    df.loc[df['LapNumber'] == df['LapNumber'].max(), 'pitted_next_lap'] = 0

    # ── Feature selection ─────────────────────────────────────────────
    feature_cols = [
        'LapNumber',
        'tyre_age',
        'compound_enc',
        'lap_time_delta',
        'gap_ahead',
        'gap_behind',
        'sc_lap',
        'circuit_id',
        'total_race_laps',
        'pit_loss_avg',
    ]

    target_cols = ['pitted_next_lap', 'compound_enc', 'LapNumber']

    result = df[feature_cols + ['pitted_next_lap', 'Compound']].copy()
    result = result.rename(columns={
        'LapNumber': 'lap_number',
        'Compound': 'compound_raw',
    })

    return result


def encode_circuit_id(circuit_id: str, known_circuits: Optional[list] = None) -> int:
    """Ordinal-encode circuit ID for tree models."""
    if known_circuits is None:
        known_circuits = [
            'bahrain', 'saudi_arabia', 'australia', 'japan', 'china',
            'miami', 'emilia_romagna', 'monaco', 'canada', 'spain',
            'austria', 'great_britain', 'hungary', 'belgium', 'netherlands',
            'italy', 'azerbaijan', 'singapore', 'united_states', 'mexico',
            'brazil', 'las_vegas', 'qatar', 'abu_dhabi',
        ]
    try:
        return known_circuits.index(circuit_id.lower())
    except ValueError:
        return len(known_circuits)  # Unknown circuit
