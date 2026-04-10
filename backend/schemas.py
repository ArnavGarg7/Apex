"""
backend/schemas.py
Pydantic models for request/response validation.
"""
from pydantic import BaseModel
from typing import Optional, List, Dict


class ShapValue(BaseModel):
    feature:   str
    value:     float
    direction: str  # 'pit' | 'stay'


class StrategyPrediction(BaseModel):
    driver_number:         int
    should_pit:            bool
    pit_confidence:        float
    recommended_compound:  str
    compound_probabilities: Dict[str, float]
    optimal_pit_lap:       int
    shap_values:           List[ShapValue]


class UndercutRequest(BaseModel):
    session_key:      int
    attacking_driver: int
    defending_driver: int
    pit_lap_offset:   int = 0


class UndercutResult(BaseModel):
    attacking_driver:      int
    defending_driver:      int
    undercut_probability:  float
    time_delta_after_pit:  float
    recommended_action:    str  # 'pit_now' | 'wait' | 'stay_out'
    reasoning:             str
