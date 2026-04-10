"""
ml/shap_explain.py
SHAP explanations for XGBoost models.
"""
import logging
import numpy as np
import pandas as pd
import shap

logger = logging.getLogger(__name__)

_explainers = {}


def _get_explainer(model):
    model_id = id(model)
    if model_id not in _explainers:
        _explainers[model_id] = shap.TreeExplainer(model)
    return _explainers[model_id]


def explain_prediction(model, feature_row: pd.DataFrame) -> dict:
    """
    Compute SHAP values for a single prediction row.

    Args:
        model: trained XGBoost model
        feature_row: single-row pd.DataFrame with feature columns

    Returns:
        dict of {feature_name: signed_shap_value}
        Positive = pushes toward pit, negative = pushes toward stay out
    """
    try:
        explainer = _get_explainer(model)
        shap_values = explainer.shap_values(feature_row)

        # For binary classifier, shap_values may be shape (1, n_features) or (2, 1, n_features)
        if isinstance(shap_values, list):
            # Binary classifier returns list of [class_0_shap, class_1_shap]
            sv = np.array(shap_values[1]).flatten()
        else:
            sv = np.array(shap_values).flatten()

        cols = feature_row.columns.tolist()
        return {col: float(sv[i]) for i, col in enumerate(cols) if i < len(sv)}

    except Exception as e:
        logger.error(f"SHAP explanation failed: {e}")
        return {}


def explain_batch(model, feature_df: pd.DataFrame) -> list:
    """
    Compute SHAP values for a batch of prediction rows.

    Returns:
        list of dicts, one per row
    """
    try:
        explainer = _get_explainer(model)
        shap_values = explainer.shap_values(feature_df)

        if isinstance(shap_values, list):
            sv = np.array(shap_values[1])
        else:
            sv = np.array(shap_values)

        cols = feature_df.columns.tolist()
        results = []
        for row_sv in sv:
            results.append({col: float(row_sv[i]) for i, col in enumerate(cols) if i < len(row_sv)})
        return results

    except Exception as e:
        logger.error(f"SHAP batch explanation failed: {e}")
        return [{} for _ in range(len(feature_df))]
