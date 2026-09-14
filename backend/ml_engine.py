import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, IsolationForest
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.model_selection import cross_val_score
from nlp_engine import analyze_project_remarks

MODEL_DIR = os.path.join(os.path.dirname(__file__), "ml_models")
COST_MODEL_PATH = os.path.join(MODEL_DIR, "cost_risk_rf.pkl")
COST_GB_MODEL_PATH = os.path.join(MODEL_DIR, "cost_risk_gb.pkl")
SCHEDULE_MODEL_PATH = os.path.join(MODEL_DIR, "schedule_delay_lr.pkl")
SCHEDULE_RIDGE_PATH = os.path.join(MODEL_DIR, "schedule_delay_ridge.pkl")
ANOMALY_MODEL_PATH = os.path.join(MODEL_DIR, "anomaly_iforest.pkl")
MODEL_META_PATH = os.path.join(MODEL_DIR, "model_metadata.pkl")

# Ensure model directory exists
os.makedirs(MODEL_DIR, exist_ok=True)

def generate_synthetic_dataset(n_samples: int = 500):
    """
    Generates a realistic synthetic dataset for training ensemble ML models.
    Increased to 500 samples for better generalization.
    """
    np.random.seed(42)
    
    budgets = np.random.uniform(50.0, 5000.0, n_samples) # Crore INR
    planned_durations = np.random.randint(12, 60, n_samples) # Months
    
    # Elapsed ratio from 0.1 to 1.2
    elapsed_ratios = np.random.uniform(0.1, 1.2, n_samples)
    elapsed_months = (planned_durations * elapsed_ratios).astype(int)
    
    # Progress ratio with noise (some projects lag significantly)
    lag_factors = np.random.beta(a=2, b=5, size=n_samples) # skewed towards lag
    current_progress_pct = np.clip(elapsed_ratios * 100 * (1 - lag_factors * 0.7), 5.0, 99.0)
    
    # Cost spent ratio (some spend fast with slow progress)
    overspending_factor = 1.0 + np.random.uniform(-0.1, 0.6, n_samples)
    spent_cr = budgets * (current_progress_pct / 100.0) * overspending_factor
    spent_cr = np.clip(spent_cr, budgets * 0.05, budgets * 1.5)
    
    # Feature Engineering
    budget_utilization_pct = (spent_cr / budgets) * 100.0
    spent_vs_progress_gap = budget_utilization_pct - current_progress_pct
    time_vs_progress_gap = (elapsed_months / planned_durations * 100.0) - current_progress_pct
    actual_progress_rate = current_progress_pct / np.maximum(elapsed_months, 1)
    required_progress_rate = (100.0 - current_progress_pct) / np.maximum(planned_durations - elapsed_months, 1)
    rate_deficit = required_progress_rate - actual_progress_rate

    # Additional engineered features for stronger models
    budget_per_month = budgets / np.maximum(planned_durations, 1)
    spend_per_month = spent_cr / np.maximum(elapsed_months, 1)
    spend_efficiency = spend_per_month / np.maximum(budget_per_month, 0.01)
    remaining_budget_ratio = np.clip((budgets - spent_cr) / np.maximum(budgets, 0.01), 0, 2)
    remaining_time_ratio = np.clip((planned_durations - elapsed_months) / np.maximum(planned_durations, 1), -0.5, 1.5)
    remaining_work_ratio = (100.0 - current_progress_pct) / 100.0

    # Ground truth targets with domain physics
    # 1. Cost overrun binary (1 if overrun > 15%, else 0)
    cost_overrun_prob = 1.0 / (1.0 + np.exp(-(0.05 * spent_vs_progress_gap + 0.02 * time_vs_progress_gap - 0.5)))
    cost_overrun_binary = (np.random.binomial(1, np.clip(cost_overrun_prob, 0.05, 0.95)))

    # 2. Schedule delay in months
    raw_delay = (time_vs_progress_gap * 0.25) + (rate_deficit * 3.5) + np.random.normal(0, 2, n_samples)
    predicted_delay_months = np.clip(raw_delay, 0, 36)

    df = pd.DataFrame({
        'budget_cr': budgets,
        'planned_duration_months': planned_durations,
        'elapsed_months': elapsed_months,
        'current_progress_pct': current_progress_pct,
        'spent_cr': spent_cr,
        'budget_utilization_pct': budget_utilization_pct,
        'spent_vs_progress_gap': spent_vs_progress_gap,
        'time_vs_progress_gap': time_vs_progress_gap,
        'actual_progress_rate': actual_progress_rate,
        'rate_deficit': rate_deficit,
        'budget_per_month': budget_per_month,
        'spend_per_month': spend_per_month,
        'spend_efficiency': spend_efficiency,
        'remaining_budget_ratio': remaining_budget_ratio,
        'remaining_time_ratio': remaining_time_ratio,
        'remaining_work_ratio': remaining_work_ratio,
        'cost_overrun_binary': cost_overrun_binary,
        'predicted_delay_months': predicted_delay_months
    })

    return df


def train_ml_models():
    """
    Trains an ensemble of models:
    - Random Forest Classifier (Cost Risk)
    - Gradient Boosting Classifier (Cost Risk)
    - Linear Regression (Schedule Delay)
    - Ridge Regression (Schedule Delay)
    - Isolation Forest (Anomaly Detection)
    Saves pickles to disk with cross-validation metadata.
    """
    df = generate_synthetic_dataset(500)
    
    feature_cols = [
        'budget_cr', 'planned_duration_months', 'elapsed_months',
        'current_progress_pct', 'spent_cr', 'budget_utilization_pct',
        'spent_vs_progress_gap', 'time_vs_progress_gap',
        'actual_progress_rate', 'rate_deficit',
        'budget_per_month', 'spend_per_month', 'spend_efficiency',
        'remaining_budget_ratio', 'remaining_time_ratio', 'remaining_work_ratio'
    ]
    
    X = df[feature_cols]
    y_cost = df['cost_overrun_binary']
    y_delay = df['predicted_delay_months']
    
    # ── 1. Random Forest Classifier for Cost Risk ──
    rf_cost = RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42, n_jobs=-1)
    rf_cost.fit(X, y_cost)
    rf_cv = cross_val_score(rf_cost, X, y_cost, cv=5, scoring='accuracy')
    
    # ── 2. Gradient Boosting Classifier for Cost Risk ──
    gb_cost = GradientBoostingClassifier(
        n_estimators=120, max_depth=5, learning_rate=0.1, 
        subsample=0.8, random_state=42
    )
    gb_cost.fit(X, y_cost)
    gb_cv = cross_val_score(gb_cost, X, y_cost, cv=5, scoring='accuracy')
    
    # ── 3. Linear Regression for Schedule Delay ──
    lr_delay = LinearRegression()
    lr_delay.fit(X, y_delay)
    lr_cv = cross_val_score(lr_delay, X, y_delay, cv=5, scoring='r2')
    
    # ── 4. Ridge Regression for Schedule Delay ──
    ridge_delay = Ridge(alpha=1.0)
    ridge_delay.fit(X, y_delay)
    ridge_cv = cross_val_score(ridge_delay, X, y_delay, cv=5, scoring='r2')
    
    # ── 5. Isolation Forest for Anomaly Detection ──
    iso_forest = IsolationForest(
        n_estimators=100, contamination=0.1, random_state=42, n_jobs=-1
    )
    iso_forest.fit(X)
    
    # ── Feature Importance (from RF and GB) ──
    rf_importance = dict(zip(feature_cols, rf_cost.feature_importances_))
    gb_importance = dict(zip(feature_cols, gb_cost.feature_importances_))
    
    # ── Save Models ──
    with open(COST_MODEL_PATH, "wb") as f:
        pickle.dump({'model': rf_cost, 'feature_cols': feature_cols}, f)

    with open(COST_GB_MODEL_PATH, "wb") as f:
        pickle.dump({'model': gb_cost, 'feature_cols': feature_cols}, f)
        
    with open(SCHEDULE_MODEL_PATH, "wb") as f:
        pickle.dump({'model': lr_delay, 'feature_cols': feature_cols}, f)
    
    with open(SCHEDULE_RIDGE_PATH, "wb") as f:
        pickle.dump({'model': ridge_delay, 'feature_cols': feature_cols}, f)
    
    with open(ANOMALY_MODEL_PATH, "wb") as f:
        pickle.dump({'model': iso_forest, 'feature_cols': feature_cols}, f)

    # ── Save Metadata ──
    metadata = {
        'training_samples': 500,
        'feature_count': len(feature_cols),
        'feature_cols': feature_cols,
        'models': {
            'random_forest': {
                'cv_accuracy_mean': round(float(rf_cv.mean()), 4),
                'cv_accuracy_std': round(float(rf_cv.std()), 4),
                'n_estimators': 150,
                'max_depth': 8,
            },
            'gradient_boosting': {
                'cv_accuracy_mean': round(float(gb_cv.mean()), 4),
                'cv_accuracy_std': round(float(gb_cv.std()), 4),
                'n_estimators': 120,
                'max_depth': 5,
                'learning_rate': 0.1,
            },
            'linear_regression': {
                'cv_r2_mean': round(float(lr_cv.mean()), 4),
                'cv_r2_std': round(float(lr_cv.std()), 4),
            },
            'ridge_regression': {
                'cv_r2_mean': round(float(ridge_cv.mean()), 4),
                'cv_r2_std': round(float(ridge_cv.std()), 4),
                'alpha': 1.0,
            },
            'isolation_forest': {
                'contamination': 0.1,
                'n_estimators': 100,
            }
        },
        'feature_importance': {
            'random_forest': {k: round(v, 4) for k, v in sorted(rf_importance.items(), key=lambda x: x[1], reverse=True)},
            'gradient_boosting': {k: round(v, 4) for k, v in sorted(gb_importance.items(), key=lambda x: x[1], reverse=True)},
        },
        'trained_at': pd.Timestamp.now().isoformat(),
    }
    
    with open(MODEL_META_PATH, "wb") as f:
        pickle.dump(metadata, f)

    return rf_cost, gb_cost, lr_delay, ridge_delay, iso_forest, feature_cols


def get_models():
    """
    Loads all models from disk or auto-trains if any are missing.
    Returns: (rf_cost, gb_cost, lr_delay, ridge_delay, iso_forest, feature_cols)
    """
    required_paths = [COST_MODEL_PATH, COST_GB_MODEL_PATH, SCHEDULE_MODEL_PATH, SCHEDULE_RIDGE_PATH, ANOMALY_MODEL_PATH]
    
    if not all(os.path.exists(p) for p in required_paths):
        return train_ml_models()
        
    try:
        with open(COST_MODEL_PATH, "rb") as f:
            cost_data = pickle.load(f)
        with open(COST_GB_MODEL_PATH, "rb") as f:
            gb_data = pickle.load(f)
        with open(SCHEDULE_MODEL_PATH, "rb") as f:
            schedule_data = pickle.load(f)
        with open(SCHEDULE_RIDGE_PATH, "rb") as f:
            ridge_data = pickle.load(f)
        with open(ANOMALY_MODEL_PATH, "rb") as f:
            anomaly_data = pickle.load(f)
        return (
            cost_data['model'], gb_data['model'],
            schedule_data['model'], ridge_data['model'],
            anomaly_data['model'], cost_data['feature_cols']
        )
    except Exception:
        return train_ml_models()


def get_model_metadata() -> dict:
    """Load and return model training metadata for display in UI."""
    if os.path.exists(MODEL_META_PATH):
        try:
            with open(MODEL_META_PATH, "rb") as f:
                return pickle.load(f)
        except Exception:
            pass
    return {}


def calculate_project_risk(
    budget_cr: float,
    spent_cr: float,
    planned_duration_months: int,
    elapsed_months: int,
    current_progress_pct: float,
    remarks_text: str = ""
) -> dict:
    """
    Predicts cost overrun probability, schedule delay in months, overall risk score (0-100),
    risk level badges, anomaly flags, and feature explainability drivers.
    Uses an ensemble of RF + Gradient Boosting for cost risk and LR + Ridge for delay.
    """
    rf_cost, gb_cost, lr_delay, ridge_delay, iso_forest, feature_cols = get_models()
    
    # Derived features
    budget_utilization_pct = (spent_cr / max(budget_cr, 0.1)) * 100.0
    spent_vs_progress_gap = budget_utilization_pct - current_progress_pct
    time_elapsed_pct = (elapsed_months / max(planned_duration_months, 1)) * 100.0
    time_vs_progress_gap = time_elapsed_pct - current_progress_pct
    actual_progress_rate = current_progress_pct / max(elapsed_months, 1)
    remaining_months = max(planned_duration_months - elapsed_months, 1)
    required_progress_rate = (100.0 - current_progress_pct) / remaining_months
    rate_deficit = max(required_progress_rate - actual_progress_rate, 0.0)
    
    # Additional engineered features
    budget_per_month = budget_cr / max(planned_duration_months, 1)
    spend_per_month = spent_cr / max(elapsed_months, 1)
    spend_efficiency = spend_per_month / max(budget_per_month, 0.01)
    remaining_budget_ratio = max(0, min(2, (budget_cr - spent_cr) / max(budget_cr, 0.01)))
    remaining_time_ratio = max(-0.5, min(1.5, (planned_duration_months - elapsed_months) / max(planned_duration_months, 1)))
    remaining_work_ratio = (100.0 - current_progress_pct) / 100.0

    input_df = pd.DataFrame([{
        'budget_cr': budget_cr,
        'planned_duration_months': planned_duration_months,
        'elapsed_months': elapsed_months,
        'current_progress_pct': current_progress_pct,
        'spent_cr': spent_cr,
        'budget_utilization_pct': budget_utilization_pct,
        'spent_vs_progress_gap': spent_vs_progress_gap,
        'time_vs_progress_gap': time_vs_progress_gap,
        'actual_progress_rate': actual_progress_rate,
        'rate_deficit': rate_deficit,
        'budget_per_month': budget_per_month,
        'spend_per_month': spend_per_month,
        'spend_efficiency': spend_efficiency,
        'remaining_budget_ratio': remaining_budget_ratio,
        'remaining_time_ratio': remaining_time_ratio,
        'remaining_work_ratio': remaining_work_ratio,
    }])[feature_cols]

    # ── Ensemble Cost Risk (average of RF + GB probabilities) ──
    rf_prob = rf_cost.predict_proba(input_df)[0][1]
    gb_prob = gb_cost.predict_proba(input_df)[0][1]
    cost_risk_prob = (rf_prob * 0.5) + (gb_prob * 0.5)
    cost_risk_score = round(cost_risk_prob * 100.0, 1)
    
    # Predicted Cost Overrun %
    predicted_cost_overrun_pct = round(max(0.0, spent_vs_progress_gap * 0.6 + (cost_risk_prob * 25.0)), 1)
    
    # ── Ensemble Schedule Delay (average of LR + Ridge) ──
    lr_pred = float(lr_delay.predict(input_df)[0])
    ridge_pred = float(ridge_delay.predict(input_df)[0])
    delay_months_pred = (lr_pred * 0.5) + (ridge_pred * 0.5)
    predicted_delay_months = round(max(0.0, delay_months_pred), 1)
    
    # Schedule Risk Score
    schedule_risk_score = round(min(99.0, max(5.0, (predicted_delay_months / max(planned_duration_months, 12)) * 100.0 + (time_vs_progress_gap * 0.4))), 1)

    # ── Anomaly Detection ──
    anomaly_pred = iso_forest.predict(input_df)[0]
    anomaly_score_raw = float(iso_forest.decision_function(input_df)[0])
    is_anomaly = bool(anomaly_pred == -1)
    anomaly_confidence = round(float(max(0.0, min(100.0, (0.5 - anomaly_score_raw) * 200))), 1)

    # Run NLP Remarks Analysis
    keywords, risk_flags, sentiment_score, nlp_risk_penalty = analyze_project_remarks(remarks_text)
    
    # ── Combined Overall Risk Score ──
    base_risk = (0.45 * cost_risk_score) + (0.45 * schedule_risk_score)
    anomaly_penalty = 8.0 if is_anomaly else 0.0
    overall_risk_score = round(min(100.0, max(0.0, base_risk + nlp_risk_penalty + anomaly_penalty)), 1)

    # Risk Levels
    def get_level(score: float) -> str:
        if score >= 65.0:
            return "High"
        elif score >= 35.0:
            return "Medium"
        else:
            return "Low"

    cost_risk_level = get_level(cost_risk_score)
    schedule_risk_level = get_level(schedule_risk_score)
    overall_risk_level = get_level(overall_risk_score)

    # Explainability & Key Risk Factors Generation
    top_risk_factors = []

    if spent_vs_progress_gap > 10.0:
        top_risk_factors.append({
            "factor": "Financial vs Progress Gap",
            "impact_score": min(95.0, round(spent_vs_progress_gap * 2.2, 1)),
            "category": "Cost Risk",
            "description": f"Budget utilization ({round(budget_utilization_pct,1)}%) leads physical progress ({round(current_progress_pct,1)}%) by {round(spent_vs_progress_gap,1)}%."
        })

    if time_vs_progress_gap > 10.0:
        top_risk_factors.append({
            "factor": "Schedule Slippage",
            "impact_score": min(95.0, round(time_vs_progress_gap * 2.0, 1)),
            "category": "Schedule Delay",
            "description": f"Time elapsed ({round(time_elapsed_pct,1)}%) exceeds progress ({round(current_progress_pct,1)}%) by {round(time_vs_progress_gap,1)}%."
        })

    if rate_deficit > 0.5:
        top_risk_factors.append({
            "factor": "Sub-optimal Pace Deficit",
            "impact_score": min(90.0, round(rate_deficit * 20.0, 1)),
            "category": "Schedule Delay",
            "description": f"Current pace ({round(actual_progress_rate,2)}%/mo) is far below required pace ({round(required_progress_rate,2)}%/mo) to meet target."
        })

    if is_anomaly:
        top_risk_factors.append({
            "factor": "Statistical Anomaly Detected",
            "impact_score": round(anomaly_confidence, 1),
            "category": "Anomaly Detection",
            "description": f"Isolation Forest flagged abnormal spending/progress pattern (confidence: {anomaly_confidence}%). Financial metrics deviate significantly from trained baselines."
        })

    if spend_efficiency > 1.3:
        top_risk_factors.append({
            "factor": "Excessive Burn Rate",
            "impact_score": min(85.0, round((spend_efficiency - 1.0) * 100, 1)),
            "category": "Cost Risk",
            "description": f"Monthly spend rate ({round(spend_per_month, 1)} Cr/mo) exceeds planned budget rate ({round(budget_per_month, 1)} Cr/mo) by {round((spend_efficiency - 1.0) * 100, 1)}%."
        })

    if risk_flags:
        top_risk_factors.append({
            "factor": "Critical Remarks NLP Signals",
            "impact_score": round(nlp_risk_penalty * 3.5, 1),
            "category": "Remarks & Governance",
            "description": f"Extracted risk flags from monitoring remarks: {', '.join(risk_flags)}."
        })

    if not top_risk_factors:
        top_risk_factors.append({
            "factor": "Normal Milestone Progression",
            "impact_score": 15.0,
            "category": "Operational",
            "description": "Project expenditure and milestone timelines are aligned within normal tolerance bands."
        })

    # Sort risk factors by impact score
    top_risk_factors = sorted(top_risk_factors, key=lambda x: x["impact_score"], reverse=True)

    return {
        "cost_risk_score": cost_risk_score,
        "cost_risk_level": cost_risk_level,
        "predicted_cost_overrun_pct": predicted_cost_overrun_pct,
        "schedule_risk_score": schedule_risk_score,
        "schedule_risk_level": schedule_risk_level,
        "predicted_delay_months": predicted_delay_months,
        "overall_risk_score": overall_risk_score,
        "overall_risk_level": overall_risk_level,
        "is_anomaly": is_anomaly,
        "anomaly_confidence": anomaly_confidence,
        "ensemble_details": {
            "rf_cost_prob": round(rf_prob, 4),
            "gb_cost_prob": round(gb_prob, 4),
            "lr_delay_months": round(lr_pred, 2),
            "ridge_delay_months": round(ridge_pred, 2),
        },
        "top_risk_factors": top_risk_factors,
        "nlp_insights": {
            "keywords": keywords,
            "risk_flags": risk_flags,
            "sentiment_score": sentiment_score,
            "nlp_risk_penalty": nlp_risk_penalty
        }
    }
