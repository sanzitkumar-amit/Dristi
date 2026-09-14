from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Project, RiskScore, Alert, RemarkInsight
from schemas import AlertSchema, AnalyticsSummary

router = APIRouter(prefix="/api", tags=["Analytics & Alerts"])

@router.get("/alerts", response_model=List[AlertSchema])
def get_alerts(
    severity: Optional[str] = None,
    is_read: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Alert).join(Project, Alert.project_id == Project.id)
    
    if severity and severity != "All":
        query = query.filter(Alert.severity == severity)
        
    if is_read is not None:
        query = query.filter(Alert.is_read == is_read)
        
    alerts = query.order_by(Alert.created_at.desc()).all()
    
    result = []
    for a in alerts:
        p = a.project
        result.append(AlertSchema(
            id=a.id,
            project_id=a.project_id,
            title=a.title,
            severity=a.severity,
            category=a.category,
            message=a.message,
            is_read=a.is_read,
            created_at=a.created_at,
            project_name=p.name if p else "Unknown Project",
            project_code=p.project_code if p else ""
        ))
    return result


@router.put("/alerts/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"message": "Alert marked as read", "alert_id": alert_id}


@router.get("/analytics/summary", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    if total_projects == 0:
        return AnalyticsSummary(
            total_projects=0,
            total_budget_cr=0.0,
            total_spent_cr=0.0,
            high_risk_projects_count=0,
            medium_risk_projects_count=0,
            low_risk_projects_count=0,
            average_risk_score=0.0,
            predicted_total_delay_months=0.0,
            department_risk_breakdown=[],
            risk_distribution={"Low": 0, "Medium": 0, "High": 0}
        )

    total_budget = db.query(func.sum(Project.budget_cr)).scalar() or 0.0
    total_spent = db.query(func.sum(Project.spent_cr)).scalar() or 0.0

    high_risk_count = db.query(RiskScore).filter(RiskScore.overall_risk_level == "High").count()
    medium_risk_count = db.query(RiskScore).filter(RiskScore.overall_risk_level == "Medium").count()
    low_risk_count = db.query(RiskScore).filter(RiskScore.overall_risk_level == "Low").count()

    avg_risk = db.query(func.avg(RiskScore.overall_risk_score)).scalar() or 0.0
    total_delay = db.query(func.sum(RiskScore.predicted_delay_months)).scalar() or 0.0

    # Department Breakdown
    dept_results = db.query(
        Project.department,
        func.count(Project.id).label("count"),
        func.avg(RiskScore.overall_risk_score).label("avg_risk"),
        func.sum(Project.budget_cr).label("total_budget")
    ).join(RiskScore, Project.id == RiskScore.project_id).group_by(Project.department).all()

    dept_breakdown = []
    for dept, count, avg_r, budget in dept_results:
        dept_breakdown.append({
            "department": dept,
            "count": count,
            "average_risk": round(avg_r or 0.0, 1),
            "total_budget_cr": round(budget or 0.0, 1)
        })

    return AnalyticsSummary(
        total_projects=total_projects,
        total_budget_cr=round(total_budget, 1),
        total_spent_cr=round(total_spent, 1),
        high_risk_projects_count=high_risk_count,
        medium_risk_projects_count=medium_risk_count,
        low_risk_projects_count=low_risk_count,
        average_risk_score=round(avg_risk, 1),
        predicted_total_delay_months=round(total_delay, 1),
        department_risk_breakdown=dept_breakdown,
        risk_distribution={
            "Low": low_risk_count,
            "Medium": medium_risk_count,
            "High": high_risk_count
        }
    )
