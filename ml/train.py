"""
ml/train.py
Train three XGBoost models:
  1. pit_classifier  — should driver pit next lap? (binary)
  2. compound_classifier — which compound to use? (multiclass)
  3. window_regressor — what is the optimal pit lap? (regression)

Usage:
  python -m ml.train --data data/processed/training_data.csv
"""
import argparse
import os
import pickle
import logging
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.metrics import f1_score, mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

MODEL_DIR = os.getenv('MODEL_DIR', './ml/models')

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


def load_data(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    logger.info(f"Loaded {len(df)} rows from {csv_path}")
    return df


def prepare_circuit_encoding(df: pd.DataFrame):
    le = LabelEncoder()
    df['circuit_id_enc'] = le.fit_transform(df['circuit_id'].astype(str))
    return df, le


def train_pit_classifier(X_train, y_train, X_val, y_val):
    pos_weight = (y_train == 0).sum() / max((y_train == 1).sum(), 1)
    model = xgb.XGBClassifier(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=pos_weight,
        use_label_encoder=False,
        eval_metric='logloss',
        early_stopping_rounds=30,
        random_state=42,
    )
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
    preds = model.predict(X_val)
    score = f1_score(y_val, preds, zero_division=0)
    logger.info(f"pit_classifier — val F1: {score:.4f}")
    return model, score


def train_compound_classifier(X_train, y_train, X_val, y_val):
    model = xgb.XGBClassifier(
        n_estimators=400,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective='multi:softmax',
        num_class=5,
        eval_metric='mlogloss',
        early_stopping_rounds=30,
        random_state=42,
    )
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
    preds = model.predict(X_val)
    score = f1_score(y_val, preds, average='weighted', zero_division=0)
    logger.info(f"compound_classifier — val weighted-F1: {score:.4f}")
    return model, score


def train_window_regressor(X_train, y_train, X_val, y_val):
    model = xgb.XGBRegressor(
        n_estimators=400,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric='mae',
        early_stopping_rounds=30,
        random_state=42,
    )
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
    preds = model.predict(X_val)
    mae = mean_absolute_error(y_val, preds)
    logger.info(f"window_regressor — val MAE: {mae:.4f} laps")
    return model, mae


def main(csv_path: str):
    os.makedirs(MODEL_DIR, exist_ok=True)
    df = load_data(csv_path)
    df, circuit_le = prepare_circuit_encoding(df)

    # Remove rows with missing critical features
    df = df.dropna(subset=FEATURE_COLS + ['pitted_next_lap', 'compound_enc'])
    logger.info(f"After cleaning: {len(df)} rows")

    X = df[FEATURE_COLS].values
    y_pit = df['pitted_next_lap'].astype(int).values
    y_compound = df['compound_enc'].astype(int).clip(0, 4).values

    # For window regressor: rows where pitted_next_lap=1, target = lap_number
    pit_rows = df[df['pitted_next_lap'] == 1].copy()
    X_win = pit_rows[FEATURE_COLS].values
    y_win = pit_rows['lap_number'].astype(float).values

    # Stratified split on pit label
    sss = StratifiedShuffleSplit(n_splits=1, test_size=0.15, random_state=42)
    train_idx, val_idx = next(sss.split(X, y_pit))

    X_tr, X_val = X[train_idx], X[val_idx]
    y_pit_tr, y_pit_val = y_pit[train_idx], y_pit[val_idx]
    y_cmp_tr, y_cmp_val = y_compound[train_idx], y_compound[val_idx]

    # Window regressor uses its own smaller split
    if len(X_win) > 50:
        split_n = max(int(len(X_win) * 0.85), 1)
        X_win_tr, X_win_val = X_win[:split_n], X_win[split_n:]
        y_win_tr, y_win_val = y_win[:split_n], y_win[split_n:]
    else:
        X_win_tr, X_win_val = X_win, X_win
        y_win_tr, y_win_val = y_win, y_win

    logger.info("Training pit_classifier...")
    pit_model, pit_f1 = train_pit_classifier(X_tr, y_pit_tr, X_val, y_pit_val)

    logger.info("Training compound_classifier...")
    cmp_model, cmp_f1 = train_compound_classifier(X_tr, y_cmp_tr, X_val, y_cmp_val)

    logger.info("Training window_regressor...")
    win_model, win_mae = train_window_regressor(X_win_tr, y_win_tr, X_win_val, y_win_val)

    # Save models
    with open(os.path.join(MODEL_DIR, 'pit_classifier.pkl'), 'wb') as f:
        pickle.dump(pit_model, f)
    with open(os.path.join(MODEL_DIR, 'compound_classifier.pkl'), 'wb') as f:
        pickle.dump(cmp_model, f)
    with open(os.path.join(MODEL_DIR, 'window_regressor.pkl'), 'wb') as f:
        pickle.dump(win_model, f)
    with open(os.path.join(MODEL_DIR, 'circuit_le.pkl'), 'wb') as f:
        pickle.dump(circuit_le, f)

    logger.info(f"Models saved to {MODEL_DIR}")
    logger.info(f"Summary — pit F1: {pit_f1:.4f} | compound F1: {cmp_f1:.4f} | window MAE: {win_mae:.4f} laps")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', required=True, help='Path to training CSV')
    args = parser.parse_args()
    main(args.data)
