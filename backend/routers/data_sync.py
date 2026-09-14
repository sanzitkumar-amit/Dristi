"""
Data Sync Router — PAIMANA / OCMS Integration Endpoints
========================================================
Provides API endpoints for syncing data from government PAIMANA and OCMS
systems into the DRISHTI database with full ML risk analysis.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Project, RiskScore, Alert, RemarkInsight
from ml_engine import calculate_project_risk, get_model_metadata
from paimana_connector import fetch_paimana_projects, fetch_ocms_contracts, get_connector_status

router = APIRouter(prefix="/api/data-sync", tags=["Data Sync"])

# Store last sync info in-memory (in production, use DB)
_sync_history = {
    "paimana": {"last_sync": None, "records": 0, "new": 0, "updated": 0, "high_risk": 0},
    "ocms": {"last_sync": None, "records": 0, "new": 0, "updated": 0, "high_risk": 0},
}


def _clean_header(header: str) -> str:
    """Normalize header text for matching."""
    import re
    cleaned = re.sub(r'\(.*?\)', '', str(header))
    cleaned = re.sub(r'[^a-zA-Z0-9]', ' ', cleaned).lower().strip()
    return re.sub(r'\s+', ' ', cleaned)


def _safe_float(val, default=0.0):
    try:
        if val is None:
            return default
        s = str(val).strip()
        if not s or s.lower() in ('nan', 'none', 'null'):
            return default
        clean_val = s.replace(',', '').replace('₹', '').replace('INR', '').replace('Cr', '').replace('cr', '').replace('%', '').strip()
        return float(clean_val)
    except (ValueError, TypeError):
        return default


def _process_and_ingest(projects_data: list, source: str, db: Session) -> dict:
    """
    Process a list of project dictionaries from PAIMANA or OCMS,
    run ML analysis, and insert/update in the DRISHTI database.
    """
    # Column mapping for PAIMANA format
    paimana_col_map = {
        'project_code': ['PAIMANA Project Code', 'PAIMANA Link Code'],
        'name': ['Project Name / Title', 'Work Description'],
        'department': ['Administrative Ministry / Department', 'Ministry / Dept'],
        'location': ['Location / Site', 'Site Location'],
        'contractor': ['Executing Agency / Contractor', 'Contractor / Agency'],
        'budget_cr': ['Sanctioned Cost (Cr INR)', 'Contract Value (Cr INR)'],
        'spent_cr': ['Expenditure to Date (Cr INR)', 'Cumulative Expenditure (Cr INR)'],
        'planned_duration': ['Scheduled Duration (Months)', 'Planned Duration (Months)'],
        'elapsed_months': ['Time Elapsed (Months)', 'Months Elapsed'],
        'progress': ['Physical Progress (%)', 'Cumulative Physical Progress (%)'],
        'remarks': ['Monitoring Remarks / Inspector Notes', 'Inspector Remarks'],
        'state': ['State / UT', 'State'],
        'district': ['District'],
        'terrain': ['Terrain Classification'],
        'landslide': ['Landslide Hazard Index (%)'],
        'gps': ['GPS Coordinates'],
        'start_date': ['Original Start Date', 'Contract Start'],
        'target_date': ['Target Completion Date', 'Stipulated Completion'],
    }

    def _get_val(row: dict, field_key: str, default=""):
        col_names = paimana_col_map.get(field_key, [])
        for col in col_names:
            if col in row and row[col] is not None:
                val = str(row[col]).strip()
                if val and val.lower() not in ('nan', 'none', 'null'):
                    return row[col]
        return default

    imported = 0
    updated = 0
    high_risk = 0
    project_results = []

    for row in projects_data:
        code = str(_get_val(row, 'project_code', '')).strip()
        if not code:
            continue

        name = str(_get_val(row, 'name', f'Project {code}')).strip()
        dept = str(_get_val(row, 'department', 'Infrastructure')).strip()
        location = str(_get_val(row, 'location', 'India')).strip()
        contractor = str(_get_val(row, 'contractor', 'Government Agency')).strip()
        budget = _safe_float(_get_val(row, 'budget_cr', 500), 500.0)
        spent = _safe_float(_get_val(row, 'spent_cr', 0), 0.0)
        planned_dur = int(_safe_float(_get_val(row, 'planned_duration', 24), 24))
        elapsed = int(_safe_float(_get_val(row, 'elapsed_months', 12), 12))
        progress = _safe_float(_get_val(row, 'progress', 50), 50.0)
        remarks = str(_get_val(row, 'remarks', '')).strip()
        state = str(_get_val(row, 'state', '')).strip()
        district = str(_get_val(row, 'district', '')).strip()
        terrain = str(_get_val(row, 'terrain', 'Urban Plain')).strip()
        landslide = _safe_float(_get_val(row, 'landslide', 0), 0.0)
        gps = str(_get_val(row, 'gps', '')).strip()
        start_date = str(_get_val(row, 'start_date', '')).strip()
        target_date = str(_get_val(row, 'target_date', '')).strip()

        # Ensure sensible bounds
        budget = max(0.01, budget)
        spent = max(0.0, spent)
        planned_dur = max(1, planned_dur)
        elapsed = max(0, elapsed)
        progress = max(0.0, min(100.0, progress))

        # Find or create project
        project = db.query(Project).filter(Project.project_code == code).first()
        is_new = project is None
        if not project:
            project = Project(project_code=code)
            db.add(project)
            imported += 1
        else:
            updated += 1

        project.name = name
        project.department = dept
        project.location = location
        project.contractor = contractor
        project.budget_cr = budget
        project.spent_cr = spent
        project.planned_duration_months = planned_dur
        project.elapsed_months = elapsed
        project.current_progress_pct = progress
        project.remarks = remarks
        project.start_date = start_date
        project.target_completion_date = target_date
        if not project.tender_status:
            project.tender_status = "In Execution"

        # Geo fields
        if state:
            project.mybharat_state = state
        if district:
            project.mybharat_district = district
        if terrain:
            project.terrain_type = terrain
        if landslide:
            project.landslide_risk_pct = landslide
        if gps:
            project.mybharat_coordinates = gps

        db.flush()

        # Run ML Risk Engine
        risk_res = calculate_project_risk(
            budget_cr=budget,
            spent_cr=spent,
            planned_duration_months=planned_dur,
            elapsed_months=elapsed,
            current_progress_pct=progress,
            remarks_text=remarks
        )

        # Update risk scores
        rs = db.query(RiskScore).filter(RiskScore.project_id == project.id).first()
        if not rs:
            rs = RiskScore(project_id=project.id)
            db.add(rs)

        rs.cost_risk_score = risk_res["cost_risk_score"]
        rs.cost_risk_level = risk_res["cost_risk_level"]
        rs.predicted_cost_overrun_pct = risk_res["predicted_cost_overrun_pct"]
        rs.schedule_risk_score = risk_res["schedule_risk_score"]
        rs.schedule_risk_level = risk_res["schedule_risk_level"]
        rs.predicted_delay_months = risk_res["predicted_delay_months"]
        rs.overall_risk_score = risk_res["overall_risk_score"]
        rs.overall_risk_level = risk_res["overall_risk_level"]
        rs.top_risk_factors = risk_res["top_risk_factors"]

        # NLP insights
        nlp_res = risk_res["nlp_insights"]
        ri = db.query(RemarkInsight).filter(RemarkInsight.project_id == project.id).first()
        if not ri:
            ri = RemarkInsight(project_id=project.id)
            db.add(ri)
        ri.extracted_keywords = nlp_res["keywords"]
        ri.risk_flags = nlp_res["risk_flags"]
        ri.sentiment_score = nlp_res["sentiment_score"]
        ri.risk_weight_addition = nlp_res["nlp_risk_penalty"]

        if risk_res["overall_risk_level"] == "High":
            high_risk += 1

        project_results.append({
            "id": project.id,
            "project_code": code,
            "name": name,
            "department": dept,
            "location": location,
            "budget_cr": budget,
            "spent_cr": spent,
            "current_progress_pct": progress,
            "overall_risk_score": risk_res["overall_risk_score"],
            "overall_risk_level": risk_res["overall_risk_level"],
            "cost_risk_score": risk_res["cost_risk_score"],
            "schedule_risk_score": risk_res["schedule_risk_score"],
            "predicted_delay_months": risk_res["predicted_delay_months"],
            "predicted_cost_overrun_pct": risk_res["predicted_cost_overrun_pct"],
            "is_anomaly": bool(risk_res.get("is_anomaly", False)),
            "anomaly_confidence": float(risk_res.get("anomaly_confidence", 0)),
            "nlp_risk_flags": nlp_res["risk_flags"],
            "action": "IMPORTED" if is_new else "UPDATED",
        })

    db.commit()

    return {
        "imported": imported,
        "updated": updated,
        "high_risk": high_risk,
        "total": len(project_results),
        "projects": project_results,
    }


@router.post("/paimana")
def sync_paimana_data(count: int = 20, db: Session = Depends(get_db)):
    """
    Fetch project data from PAIMANA system and ingest into DRISHTI
    with full ML risk analysis.
    """
    raw_data = fetch_paimana_projects(count=count)
    result = _process_and_ingest(raw_data, "paimana", db)

    _sync_history["paimana"] = {
        "last_sync": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "records": result["total"],
        "new": result["imported"],
        "updated": result["updated"],
        "high_risk": result["high_risk"],
    }

    total = result["total"]
    avg_risk = round(sum(p["overall_risk_score"] for p in result["projects"]) / max(1, total), 1)
    total_budget = round(sum(p["budget_cr"] for p in result["projects"]), 1)
    anomaly_count = sum(1 for p in result["projects"] if p["is_anomaly"])

    return {
        "message": f"PAIMANA sync completed. {result['imported']} new, {result['updated']} updated projects processed through DRISHTI ML engine.",
        "source": "PAIMANA",
        "sync_timestamp": _sync_history["paimana"]["last_sync"],
        "imported_count": result["imported"],
        "updated_count": result["updated"],
        "total_processed": total,
        "high_risk_flagged": result["high_risk"],
        "anomalies_detected": anomaly_count,
        "summary": {
            "total_budget_cr": total_budget,
            "average_risk_score": avg_risk,
            "high_risk_count": result["high_risk"],
            "anomaly_count": anomaly_count,
        },
        "project_results": result["projects"],
    }


@router.post("/ocms")
def sync_ocms_data(count: int = 10, db: Session = Depends(get_db)):
    """
    Fetch contract data from OCMS system and ingest into DRISHTI
    with full ML risk analysis.
    """
    raw_data = fetch_ocms_contracts(count=count)
    result = _process_and_ingest(raw_data, "ocms", db)

    _sync_history["ocms"] = {
        "last_sync": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "records": result["total"],
        "new": result["imported"],
        "updated": result["updated"],
        "high_risk": result["high_risk"],
    }

    total = result["total"]
    avg_risk = round(sum(p["overall_risk_score"] for p in result["projects"]) / max(1, total), 1)
    total_budget = round(sum(p["budget_cr"] for p in result["projects"]), 1)
    anomaly_count = sum(1 for p in result["projects"] if p["is_anomaly"])

    return {
        "message": f"OCMS sync completed. {result['imported']} new, {result['updated']} updated contracts processed through DRISHTI ML engine.",
        "source": "OCMS",
        "sync_timestamp": _sync_history["ocms"]["last_sync"],
        "imported_count": result["imported"],
        "updated_count": result["updated"],
        "total_processed": total,
        "high_risk_flagged": result["high_risk"],
        "anomalies_detected": anomaly_count,
        "summary": {
            "total_budget_cr": total_budget,
            "average_risk_score": avg_risk,
            "high_risk_count": result["high_risk"],
            "anomaly_count": anomaly_count,
        },
        "project_results": result["projects"],
    }


@router.post("/full")
def sync_all_sources(db: Session = Depends(get_db)):
    """
    Combined sync from both PAIMANA and OCMS systems.
    """
    paimana_raw = fetch_paimana_projects(count=20)
    ocms_raw = fetch_ocms_contracts(count=10)
    
    paimana_result = _process_and_ingest(paimana_raw, "paimana", db)
    ocms_result = _process_and_ingest(ocms_raw, "ocms", db)

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    _sync_history["paimana"] = {
        "last_sync": now,
        "records": paimana_result["total"],
        "new": paimana_result["imported"],
        "updated": paimana_result["updated"],
        "high_risk": paimana_result["high_risk"],
    }
    _sync_history["ocms"] = {
        "last_sync": now,
        "records": ocms_result["total"],
        "new": ocms_result["imported"],
        "updated": ocms_result["updated"],
        "high_risk": ocms_result["high_risk"],
    }

    total = paimana_result["total"] + ocms_result["total"]
    all_projects = paimana_result["projects"] + ocms_result["projects"]
    avg_risk = round(sum(p["overall_risk_score"] for p in all_projects) / max(1, total), 1)
    total_budget = round(sum(p["budget_cr"] for p in all_projects), 1)
    high_risk = paimana_result["high_risk"] + ocms_result["high_risk"]
    anomaly_count = sum(1 for p in all_projects if p["is_anomaly"])

    return {
        "message": f"Full sync completed. {total} projects processed from PAIMANA + OCMS through DRISHTI ML engine.",
        "sync_timestamp": now,
        "total_processed": total,
        "paimana_count": paimana_result["total"],
        "ocms_count": ocms_result["total"],
        "imported_count": paimana_result["imported"] + ocms_result["imported"],
        "updated_count": paimana_result["updated"] + ocms_result["updated"],
        "high_risk_flagged": high_risk,
        "anomalies_detected": anomaly_count,
        "summary": {
            "total_budget_cr": total_budget,
            "average_risk_score": avg_risk,
            "high_risk_count": high_risk,
            "anomaly_count": anomaly_count,
        },
        "project_results": all_projects,
    }


@router.get("/status")
def get_sync_status():
    """
    Returns the current sync status, connection health, and model metadata.
    """
    connector_status = get_connector_status()
    model_meta = get_model_metadata()

    return {
        "connectors": connector_status,
        "sync_history": _sync_history,
        "ml_engine": {
            "status": "Operational",
            "models_loaded": 5,
            "model_names": [
                "Random Forest (Cost Risk)",
                "Gradient Boosting (Cost Risk)",
                "Linear Regression (Schedule Delay)",
                "Ridge Regression (Schedule Delay)",
                "Isolation Forest (Anomaly Detection)"
            ],
            "training_samples": model_meta.get("training_samples", 500),
            "feature_count": model_meta.get("feature_count", 16),
            "models_detail": model_meta.get("models", {}),
            "feature_importance": model_meta.get("feature_importance", {}),
            "trained_at": model_meta.get("trained_at", ""),
        }
    }
