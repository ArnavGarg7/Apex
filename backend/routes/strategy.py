"""
backend/routes/strategy.py
ML strategy predictions and SHAP explanations.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from backend.services.model_service import predict_for_driver
from backend.services import openf1_service as openf1
from backend.schemas import StrategyPrediction, ShapValue, UndercutRequest, UndercutResult
from backend.dependencies import require_auth

router = APIRouter()


@router.get('/predict/{driver_number}')
async def predict_strategy(driver_number: int, session_key: Optional[int] = None,
                            user=Depends(require_auth)):
    """ML pit-stop prediction for a driver in the current session."""
    if not session_key:
        session_key = await openf1.get_latest_session_key()
    if not session_key:
        raise HTTPException(status_code=404, detail='No active session')

    result = await predict_for_driver(session_key, driver_number)
    if not result:
        raise HTTPException(status_code=422, detail='Could not generate prediction')

    # Shape SHAP values
    shap_list = [
        ShapValue(
            feature=k,
            value=v,
            direction='pit' if v > 0 else 'stay',
        )
        for k, v in result.get('shap_values', {}).items()
    ]
    shap_list.sort(key=lambda x: abs(x.value), reverse=True)

    return {
        'driver_number': driver_number,
        'should_pit': result.get('should_pit', False),
        'pit_confidence': result.get('pit_confidence', 0.0),
        'recommended_compound': result.get('recommended_compound', 'UNKNOWN'),
        'compound_probabilities': result.get('compound_probabilities', {}),
        'optimal_pit_lap': result.get('optimal_pit_lap', 0),
        'shap_values': [s.dict() for s in shap_list],
        'data_delay_seconds': 30,
    }


@router.get('/predict-all')
async def predict_all_drivers(session_key: Optional[int] = None, user=Depends(require_auth)):
    """Predictions for all drivers in the current session."""
    if not session_key:
        session_key = await openf1.get_latest_session_key()
    if not session_key:
        raise HTTPException(status_code=404, detail='No active session')

    drivers = await openf1.get_drivers(session_key)
    results = []
    for drv in drivers:
        dn = drv.get('driver_number')
        if dn:
            result = await predict_for_driver(session_key, dn)
            if result:
                result['driver_code'] = drv.get('name_acronym', '???')
                results.append(result)
    return results


@router.post('/undercut')
async def simulate_undercut(body: UndercutRequest, user=Depends(require_auth)):
    """Undercut probability simulation."""
    # Fetch recent laps for both drivers
    session_key = body.session_key
    atk_laps = await openf1.get_lap_data(session_key, body.attacking_driver, 5)
    def_laps = await openf1.get_lap_data(session_key, body.defending_driver, 5)

    if not atk_laps or not def_laps:
        raise HTTPException(status_code=422, detail='Insufficient lap data')

    # Simple undercut model:
    # Probability = f(gap, tyre_delta_age, pit_loss)
    intervals = await openf1.get_intervals(session_key)
    gap = 0.0
    for iv in intervals:
        if iv.get('driver_number') == body.defending_driver:
            try:
                gap = float(str(iv.get('gap_to_leader', '0')).replace('+', ''))
            except Exception:
                gap = 3.0
            break

    atk_tyre_age = atk_laps[-1].get('tyre_life_laps', 10)
    def_tyre_age = def_laps[-1].get('tyre_life_laps', 10)
    pit_loss = 22.0  # seconds

    tyre_advantage = max(0.0, float(def_tyre_age) - float(atk_tyre_age)) * 0.05  # rough est
    time_delta = gap - pit_loss + tyre_advantage + (body.pit_lap_offset * 0.1)

    probability = max(0.0, min(1.0, 0.5 + (time_delta / 20.0)))

    action = 'wait'
    if probability > 0.7:
        action = 'pit_now'
    elif probability < 0.3:
        action = 'stay_out'

    return UndercutResult(
        attacking_driver=body.attacking_driver,
        defending_driver=body.defending_driver,
        undercut_probability=round(probability, 3),
        time_delta_after_pit=round(time_delta, 2),
        recommended_action=action,
        reasoning=f"Gap: {gap:.1f}s | Pit loss: {pit_loss}s | Tyre delta advantage: {tyre_advantage:.2f}s",
    )
