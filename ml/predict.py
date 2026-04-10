"""
ml/predict.py
Loads trained XGBoost models and provides inference functions.
"""
import os
import pickle
import logging
import numpy as np
import pandas as pd
from typing import Optional
from ml.shap_explain import explain_prediction

logger = logging.getLogger(__name__)

MODEL_DIR = os.getenv('MODEL_DIR', './ml/models')

COMPOUND_DECODE = {0: 'SOFT', 1: 'MEDIUM', 2: 'HARD', 3: 'INTERMEDIATE', 4: 'WET'}

FEATURE_COLS = [
    'lap_number',
    'tyre_age',
    'compound_enc',
    'lap_time_delta',
    'gap_ahead',
    'gap_behind',
    'sc_lap',
    'circuit_id_enc',
    'total_race_laps',
    'pit_loss_avg',
]

_models = {}


def _load_models():
    global _models
    if _models:
        return
    try:
        with open(os.path.join(MODEL_DIR, 'pit_classifier.pkl'), 'rb') as f:
            _models['pit'] = pickle.load(f)
        with open(os.path.join(MODEL_DIR, 'compound_classifier.pkl'), 'rb') as f:
            _models['compound'] = pickle.load(f)
        with open(os.path.join(MODEL_DIR, 'window_regressor.pkl'), 'rb') as f:
            _models['window'] = pickle.load(f)
        with open(os.path.join(MODEL_DIR, 'circuit_le.pkl'), 'rb') as f:
            _models['circuit_le'] = pickle.load(f)
        logger.info("All ML models loaded successfully")
    except FileNotFoundError as e:
        logger.warning(f"Model file not found: {e}. Run ml/train.py first.")
        _models = {}


def models_loaded() -> bool:
    _load_models()
    return bool(_models)


def predict_pit(feature_row: dict) -> dict:
    """
    Run all three models on a single feature row.

    Args:
        feature_row: dict with keys matching FEATURE_COLS
                     plus 'circuit_id' (string) instead of 'circuit_id_enc'

    Returns:
        dict with:
          - should_pit: bool
          - pit_confidence: float [0,1]
          - recommended_compound: str (SOFT/MEDIUM/HARD/INTER/WET)
          - compound_probabilities: dict[str, float]
          - optimal_pit_lap: int
          - shap_values: dict[feature_name, float]
    """
    _load_models()
    if not _models:
        return _fallback_response()

    # Encode circuit
    circuit_id = feature_row.get('circuit_id', 'unknown')
    try:
        enc = _models['circuit_le'].transform([circuit_id])[0]
    except Exception:
        enc = int(feature_row.get('circuit_id_enc', 0))

    row = {**feature_row, 'circuit_id_enc': enc}
    X = pd.DataFrame([{col: row.get(col, 0) for col in FEATURE_COLS}])

    # Pit probability
    pit_prob = float(_models['pit'].predict_proba(X)[0][1])
    should_pit = pit_prob >= 0.5

    # Compound prediction
    compound_probs_raw = _models['compound'].predict_proba(X)[0]
    compound_idx = int(np.argmax(compound_probs_raw))
    compound_label = COMPOUND_DECODE.get(compound_idx, 'UNKNOWN')
    compound_probs = {COMPOUND_DECODE.get(i, str(i)): float(p) for i, p in enumerate(compound_probs_raw)}

    # Optimal pit window lap
    pit_lap_pred = int(round(float(_models['window'].predict(X)[0])))

    # SHAP explanation on pit classifier
    shap_vals = explain_prediction(_models['pit'], X)

    return {
        'should_pit': should_pit,
        'pit_confidence': pit_prob,
        'recommended_compound': compound_label,
        'compound_probabilities': compound_probs,
        'optimal_pit_lap': pit_lap_pred,
        'shap_values': shap_vals,
    }


def _fallback_response() -> dict:
    return {
        'should_pit': False,
        'pit_confidence': 0.0,
        'recommended_compound': 'UNKNOWN',
        'compound_probabilities': {},
        'optimal_pit_lap': 0,
        'shap_values': {},
        'error': 'Models not loaded. Run ml/train.py first.',
    }
