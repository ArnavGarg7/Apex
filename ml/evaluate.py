"""
ml/evaluate.py
Evaluation utilities for all three models.
"""
import numpy as np
import pandas as pd
from sklearn.metrics import (
    f1_score, precision_score, recall_score,
    confusion_matrix, mean_absolute_error, mean_squared_error,
    classification_report
)
import logging

logger = logging.getLogger(__name__)


def evaluate_pit_classifier(model, X_val, y_val) -> dict:
    preds = model.predict(X_val)
    probs = model.predict_proba(X_val)[:, 1]

    return {
        'f1': float(f1_score(y_val, preds, zero_division=0)),
        'precision': float(precision_score(y_val, preds, zero_division=0)),
        'recall': float(recall_score(y_val, preds, zero_division=0)),
        'confusion_matrix': confusion_matrix(y_val, preds).tolist(),
        'report': classification_report(y_val, preds, output_dict=True),
    }


def evaluate_compound_classifier(model, X_val, y_val) -> dict:
    preds = model.predict(X_val)
    return {
        'weighted_f1': float(f1_score(y_val, preds, average='weighted', zero_division=0)),
        'macro_f1': float(f1_score(y_val, preds, average='macro', zero_division=0)),
        'report': classification_report(y_val, preds, output_dict=True),
    }


def evaluate_window_regressor(model, X_val, y_val) -> dict:
    preds = model.predict(X_val)
    return {
        'mae': float(mean_absolute_error(y_val, preds)),
        'rmse': float(np.sqrt(mean_squared_error(y_val, preds))),
        'within_1_lap': float(np.mean(np.abs(preds - y_val) <= 1)),
        'within_3_laps': float(np.mean(np.abs(preds - y_val) <= 3)),
    }
