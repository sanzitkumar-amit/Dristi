from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc

from database import get_db
from models import (
    Project, RiskScore, Alert, RemarkInsight, HistoricalProgress,
    ProjectMilestone, VendorProposal, CitizenFeedback, CitizenConcern
)
from schemas import (
    ProjectSchema, TransparencyProjectListItem, TransparencyOverviewSchema,
    TenderPublishSchema, MilestoneCreateSchema, MilestoneUpdateSchema, ProjectMilestoneSchema,
    ProposalSubmitSchema, ProposalStatusUpdateSchema, VendorProposalSchema,
    FeedbackCreateSchema, CitizenFeedbackSchema,
    ConcernCreateSchema, ConcernResponseSchema, CitizenConcernSchema
)
from ml_engine import calculate_project_risk

router = APIRouter(prefix="/api/transparency", tags=["Civic Transparency & Tenders"])


@router.get("/overview", response_model=TransparencyOverviewSchema)
def get_transparency_overview(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    if total_projects == 0:
        return TransparencyOverviewSchema(
            total_public_projects=0,
            total_public_funds_cr=0.0,
            total_spent_funds_cr=0.0,
            open_tenders_count=0,
            active_construction_count=0,
            completed_projects_count=0,
            total_proposals_received=0,
            awarded_contracts_count=0,
            citizen_feedbacks_count=0,
            citizen_average_rating=5.0,
            total_concerns_raised=0,
            concerns_resolved_count=0,
            concerns_resolution_rate_pct=100.0,
            community_trust_index=95.0,
            recent_activity=[]
        )

    total_funds = db.query(func.sum(Project.budget_cr)).scalar() or 0.0
    total_spent = db.query(func.sum(Project.spent_cr)).scalar() or 0.0

    open_tenders = db.query(Project).filter(
        Project.tender_status.in_(["Open for Bids", "Evaluation"])
    ).count()

    active_construction = db.query(Project).filter(
        Project.tender_status.in_(["In Execution", "Contract Awarded"])
    ).count()

    completed_projects = db.query(Project).filter(
        Project.tender_status.in_(["Completed", "Under Audit"])
    ).count()

    total_proposals = db.query(VendorProposal).count()
    awarded_contracts = db.query(VendorProposal).filter(VendorProposal.status == "Awarded").count()

    feedbacks_count = db.query(CitizenFeedback).count()
    avg_rating = db.query(func.avg(CitizenFeedback.rating_overall)).scalar() or 4.2

    total_concerns = db.query(CitizenConcern).count()
    resolved_concerns = db.query(CitizenConcern).filter(CitizenConcern.status.in_(["Resolved", "Action Taken"])).count()
    resolution_rate = round((resolved_concerns / max(1, total_concerns)) * 100.0, 1)

    # Calculate dynamic Community Trust Index (0 - 100)
    # Based on average rating (40%), concern resolution rate (40%), and low-risk project ratio (20%)
    low_risk_count = db.query(RiskScore).filter(RiskScore.overall_risk_level == "Low").count()
    low_risk_ratio = (low_risk_count / max(1, total_projects)) * 100.0
    
    trust_index = round(
        (avg_rating / 5.0) * 40.0 +
        (resolution_rate / 100.0) * 40.0 +
        (low_risk_ratio / 100.0) * 20.0,
        1
    )

    # Activity stream from recent milestones, feedbacks, proposals, concerns
    recent_activity = []
    
    recent_feedbacks = db.query(CitizenFeedback).order_by(desc(CitizenFeedback.created_at)).limit(3).all()
    for f in recent_feedbacks:
        p = f.project
        recent_activity.append({
            "type": "feedback",
            "title": f"Citizen Review: {p.name if p else 'Project'}",
            "description": f"{f.citizen_name} rated {f.rating_overall}★ — '{f.comment[:60]}...'",
            "time": f.created_at.strftime("%Y-%m-%d %H:%M") if f.created_at else "Recently",
            "badge": f"{f.rating_overall}★ {f.aspect}"
        })

    recent_proposals = db.query(VendorProposal).order_by(desc(VendorProposal.submitted_at)).limit(3).all()
    for prop in recent_proposals:
        p = prop.project
        recent_activity.append({
            "type": "proposal",
            "title": f"Tender Bid Received: {prop.vendor_name}",
            "description": f"Submitted quote of ₹{prop.bid_amount_cr} Cr for {p.name if p else 'Project'}",
            "time": prop.submitted_at.strftime("%Y-%m-%d %H:%M") if prop.submitted_at else "Recently",
            "badge": f"₹{prop.bid_amount_cr} Cr ({prop.status})"
        })

    recent_concerns = db.query(CitizenConcern).order_by(desc(CitizenConcern.created_at)).limit(3).all()
    for c in recent_concerns:
        p = c.project
        recent_activity.append({
            "type": "concern",
            "title": f"Accountability Flag: {c.title}",
            "description": f"[{c.concern_type}] {c.description[:60]}... Status: {c.status}",
            "time": c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else "Recently",
            "badge": f"{c.severity} Severity"
        })

    return TransparencyOverviewSchema(
        total_public_projects=total_projects,
        total_public_funds_cr=round(total_funds, 1),
        total_spent_funds_cr=round(total_spent, 1),
        open_tenders_count=open_tenders,
        active_construction_count=active_construction,
        completed_projects_count=completed_projects,
        total_proposals_received=total_proposals,
        awarded_contracts_count=awarded_contracts,
        citizen_feedbacks_count=feedbacks_count,
        citizen_average_rating=round(avg_rating, 2),
        total_concerns_raised=total_concerns,
        concerns_resolved_count=resolved_concerns,
        concerns_resolution_rate_pct=resolution_rate,
        community_trust_index=trust_index,
        recent_activity=recent_activity
    )


@router.get("/projects", response_model=List[TransparencyProjectListItem])
def get_transparency_projects(
    search: Optional[str] = None,
    department: Optional[str] = None,
    tender_status: Optional[str] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Project)

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Project.name.ilike(term),
                Project.project_code.ilike(term),
                Project.location.ilike(term),
                Project.contractor.ilike(term),
                Project.purpose.ilike(term)
            )
        )

    if department and department != "All":
        query = query.filter(Project.department == department)

    if tender_status and tender_status != "All":
        query = query.filter(Project.tender_status == tender_status)

    if min_budget is not None:
        query = query.filter(Project.budget_cr >= min_budget)

    if max_budget is not None:
        query = query.filter(Project.budget_cr <= max_budget)

    projects = query.order_by(desc(Project.created_at)).all()

    result = []
    for p in projects:
        rs = p.risk_score
        milestones = p.milestones or []
        completed_milestones = sum(1 for m in milestones if m.status in ["Completed", "Verified by Auditor"])
        proposals_count = len(p.proposals) if p.proposals else 0
        feedbacks = p.feedbacks or []
        rating_avg = round(sum(f.rating_overall for f in feedbacks) / len(feedbacks), 1) if feedbacks else 4.5
        open_concerns = sum(1 for c in (p.concerns or []) if c.status in ["Open", "Under Investigation"])

        result.append(TransparencyProjectListItem(
            id=p.id,
            project_code=p.project_code,
            name=p.name,
            department=p.department,
            location=p.location or "National",
            contractor=p.contractor or "Pending Vendor Award",
            budget_cr=p.budget_cr,
            spent_cr=p.spent_cr,
            planned_duration_months=p.planned_duration_months,
            elapsed_months=p.elapsed_months,
            current_progress_pct=p.current_progress_pct,
            tender_status=p.tender_status or "In Execution",
            bidding_deadline=p.bidding_deadline or "",
            tender_category=p.tender_category or "Civil Infrastructure",
            purpose=p.purpose or "",
            milestones_total=len(milestones),
            milestones_completed=completed_milestones,
            proposals_count=proposals_count,
            citizen_rating_avg=rating_avg,
            citizen_feedbacks_count=len(feedbacks),
            open_concerns_count=open_concerns,
            overall_risk_level=rs.overall_risk_level if rs else "Low",
            overall_risk_score=rs.overall_risk_score if rs else 0.0
        ))

    return result


@router.get("/projects/{project_id}", response_model=ProjectSchema)
def get_transparency_project_dossier(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/projects", response_model=ProjectSchema)
def publish_government_tender(data: TenderPublishSchema, db: Session = Depends(get_db)):
    # Verify uniqueness of project code
    existing = db.query(Project).filter(Project.project_code == data.project_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Project code '{data.project_code}' already exists.")

    project = Project(
        project_code=data.project_code,
        name=data.name,
        department=data.department,
        location=data.location,
        contractor="Open for Competitive Bidding",
        budget_cr=data.budget_cr,
        spent_cr=0.0,
        planned_duration_months=data.planned_duration_months,
        elapsed_months=0,
        current_progress_pct=0.0,
        start_date=data.start_date,
        target_completion_date=data.target_completion_date,
        remarks="Newly published public project and transparent tender call.",
        purpose=data.purpose,
        specifications=data.specifications,
        design_doc_url=data.design_doc_url or "https://drishti.gov.in/designs/spec-portal",
        tender_status="Open for Bids",
        bidding_deadline=data.bidding_deadline,
        min_vendor_experience_years=data.min_vendor_experience_years,
        tender_category=data.tender_category
    )
    db.add(project)
    db.flush()

    # Add initial milestones if provided, or generate defaults
    if data.initial_milestones and len(data.initial_milestones) > 0:
        for idx, m in enumerate(data.initial_milestones, 1):
            ms = ProjectMilestone(
                project_id=project.id,
                milestone_number=m.milestone_number or idx,
                title=m.title,
                description=m.description or "",
                target_date=m.target_date or "",
                allocated_budget_cr=m.allocated_budget_cr or round(project.budget_cr / len(data.initial_milestones), 1),
                spent_budget_cr=0.0,
                status="Pending",
                progress_pct=0.0,
                official_update_notes="Milestone scheduled in tender scope."
            )
            db.add(ms)
    else:
        default_milestones = [
            ("Detailed Engineering & Site Mobilization", 0.15),
            ("Substructure & Heavy Foundation Works", 0.35),
            ("Superstructure & Mechanical Integration", 0.35),
            ("Testing, Safety Audit & Public Commissioning", 0.15)
        ]
        for idx, (title, b_ratio) in enumerate(default_milestones, 1):
            ms = ProjectMilestone(
                project_id=project.id,
                milestone_number=idx,
                title=title,
                description=f"Phase {idx} key deliverable as per government specifications.",
                target_date="",
                allocated_budget_cr=round(project.budget_cr * b_ratio, 1),
                spent_budget_cr=0.0,
                status="Pending",
                progress_pct=0.0,
                official_update_notes="Awaiting contractor mobilization."
            )
            db.add(ms)

    # Calculate initial risk metrics
    risk_res = calculate_project_risk(
        budget_cr=project.budget_cr,
        spent_cr=project.spent_cr,
        planned_duration_months=project.planned_duration_months,
        elapsed_months=project.elapsed_months,
        current_progress_pct=project.current_progress_pct,
        remarks_text=project.remarks
    )

    risk_score = RiskScore(
        project_id=project.id,
        cost_risk_score=risk_res["cost_risk_score"],
        cost_risk_level=risk_res["cost_risk_level"],
        predicted_cost_overrun_pct=risk_res["predicted_cost_overrun_pct"],
        schedule_risk_score=risk_res["schedule_risk_score"],
        schedule_risk_level=risk_res["schedule_risk_level"],
        predicted_delay_months=risk_res["predicted_delay_months"],
        overall_risk_score=risk_res["overall_risk_score"],
        overall_risk_level=risk_res["overall_risk_level"],
        top_risk_factors=risk_res["top_risk_factors"]
    )
    db.add(risk_score)

    nlp_res = risk_res["nlp_insights"]
    remark_insight = RemarkInsight(
        project_id=project.id,
        extracted_keywords=nlp_res["keywords"],
        risk_flags=nlp_res["risk_flags"],
        sentiment_score=nlp_res["sentiment_score"],
        risk_weight_addition=nlp_res["nlp_risk_penalty"]
    )
    db.add(remark_insight)

    # Generate initial notification alert
    alert = Alert(
        project_id=project.id,
        title=f"NEW PUBLIC TENDER PUBLISHED: {project.project_code}",
        severity="Info",
        category="System",
        message=f"Transparent tender for '{project.name}' (₹{project.budget_cr} Cr) is now open for vendor applications. Bidding deadline: {project.bidding_deadline}."
    )
    db.add(alert)

    db.commit()
    db.refresh(project)
    return project


@router.post("/projects/{project_id}/milestones", response_model=ProjectMilestoneSchema)
def add_project_milestone(project_id: int, data: MilestoneCreateSchema, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestone = ProjectMilestone(
        project_id=project.id,
        milestone_number=data.milestone_number,
        title=data.title,
        description=data.description or "",
        target_date=data.target_date or "",
        allocated_budget_cr=data.allocated_budget_cr,
        spent_budget_cr=0.0,
        status="Pending",
        progress_pct=0.0,
        official_update_notes="Milestone defined by project management authority."
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.put("/milestones/{milestone_id}", response_model=ProjectMilestoneSchema)
def update_milestone_progress(milestone_id: int, data: MilestoneUpdateSchema, db: Session = Depends(get_db)):
    milestone = db.query(ProjectMilestone).filter(ProjectMilestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    if data.status is not None:
        milestone.status = data.status
    if data.progress_pct is not None:
        milestone.progress_pct = max(0.0, min(100.0, data.progress_pct))
    if data.spent_budget_cr is not None:
        milestone.spent_budget_cr = max(0.0, data.spent_budget_cr)
    if data.completion_date is not None:
        milestone.completion_date = data.completion_date
    if data.official_update_notes is not None:
        milestone.official_update_notes = data.official_update_notes

    milestone.updated_at = datetime.utcnow()
    
    # Recalculate project total progress & spent from all milestones
    project = milestone.project
    if project and project.milestones:
        total_ms = len(project.milestones)
        if total_ms > 0:
            avg_progress = sum(m.progress_pct for m in project.milestones) / total_ms
            project.current_progress_pct = round(avg_progress, 1)
            project.spent_cr = round(sum(m.spent_budget_cr for m in project.milestones), 1)

    db.commit()
    db.refresh(milestone)
    return milestone


@router.post("/projects/{project_id}/apply", response_model=VendorProposalSchema)
def submit_vendor_proposal(project_id: int, data: ProposalSubmitSchema, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.tender_status not in ["Open for Bids", "Evaluation", "Draft"]:
        raise HTTPException(status_code=400, detail=f"Tender is not currently accepting bids (Current status: {project.tender_status}).")

    proposal = VendorProposal(
        project_id=project.id,
        vendor_name=data.vendor_name,
        vendor_email=data.vendor_email,
        vendor_phone=data.vendor_phone or "",
        vendor_registration_no=data.vendor_registration_no or "",
        years_of_experience=data.years_of_experience,
        bid_amount_cr=data.bid_amount_cr,
        proposed_duration_months=data.proposed_duration_months,
        technical_proposal=data.technical_proposal,
        key_personnel=data.key_personnel or "",
        financial_capacity_score=min(100.0, 75.0 + (data.years_of_experience * 2.0)),
        compliance_certified=data.compliance_certified,
        status="Submitted",
        decision_notes="Awaiting technical & financial bid evaluation."
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return proposal


@router.put("/proposals/{proposal_id}/status", response_model=VendorProposalSchema)
def review_vendor_proposal(proposal_id: int, data: ProposalStatusUpdateSchema, db: Session = Depends(get_db)):
    proposal = db.query(VendorProposal).filter(VendorProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    proposal.status = data.status
    if data.decision_notes:
        proposal.decision_notes = data.decision_notes
    proposal.reviewed_at = datetime.utcnow()

    # If Awarded, update the project contractor, budget, and transition status to 'In Execution'
    if data.status == "Awarded":
        project = proposal.project
        if project:
            project.contractor = proposal.vendor_name
            project.tender_status = "In Execution"
            
            # Reject or keep other proposals as evaluated
            other_proposals = db.query(VendorProposal).filter(
                VendorProposal.project_id == project.id,
                VendorProposal.id != proposal.id
            ).all()
            for op in other_proposals:
                if op.status in ["Submitted", "Shortlisted"]:
                    op.status = "Rejected"
                    op.decision_notes = f"Contract awarded to {proposal.vendor_name} based on competitive score."

            alert = Alert(
                project_id=project.id,
                title=f"CONTRACT AWARDED: {project.project_code}",
                severity="Info",
                category="System",
                message=f"Contract awarded to {proposal.vendor_name} at ₹{proposal.bid_amount_cr} Cr (Budget: ₹{project.budget_cr} Cr). Project status updated to In Execution."
            )
            db.add(alert)

    db.commit()
    db.refresh(proposal)
    return proposal


@router.post("/projects/{project_id}/feedback", response_model=CitizenFeedbackSchema)
def submit_citizen_feedback(project_id: int, data: FeedbackCreateSchema, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    avg_rating = round((data.rating_quality + data.rating_speed + data.rating_safety) / 3.0, 1)
    sentiment = "Positive" if avg_rating >= 3.8 else "Concern" if avg_rating <= 2.5 else "Neutral"

    feedback = CitizenFeedback(
        project_id=project.id,
        citizen_name=data.citizen_name or "Verified Resident",
        citizen_location=data.citizen_location or project.location or "Ward Area",
        is_verified_resident=True,
        rating_quality=data.rating_quality,
        rating_speed=data.rating_speed,
        rating_safety=data.rating_safety,
        rating_overall=avg_rating,
        aspect=data.aspect,
        comment=data.comment,
        sentiment=sentiment,
        upvotes=0
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.post("/feedbacks/{feedback_id}/upvote")
def upvote_citizen_feedback(feedback_id: int, db: Session = Depends(get_db)):
    feedback = db.query(CitizenFeedback).filter(CitizenFeedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    feedback.upvotes += 1
    db.commit()
    return {"id": feedback.id, "upvotes": feedback.upvotes}


@router.post("/projects/{project_id}/concerns", response_model=CitizenConcernSchema)
def raise_citizen_concern(project_id: int, data: ConcernCreateSchema, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    concern = CitizenConcern(
        project_id=project.id,
        citizen_name=data.citizen_name or "Concerned Citizen",
        citizen_email=data.citizen_email or "",
        concern_type=data.concern_type,
        title=data.title,
        description=data.description,
        location_detail=data.location_detail or project.location or "Site Area",
        severity=data.severity,
        status="Open",
        upvotes=1,
        official_response="Registered in public oversight ledger. Government inquiry ticket dispatched to Project Director."
    )
    db.add(concern)

    # If Critical / High, trigger high-priority alert in DRISHTI system
    if data.severity in ["Critical", "High"]:
        alert = Alert(
            project_id=project.id,
            title=f"CITIZEN GRIEVANCE FLAG: {data.title}",
            severity="Critical" if data.severity == "Critical" else "Warning",
            category="Remarks",
            message=f"Citizen '{concern.citizen_name}' raised a {data.severity} concern regarding {data.concern_type}: {data.description[:100]}..."
        )
        db.add(alert)

    db.commit()
    db.refresh(concern)
    return concern


@router.post("/concerns/{concern_id}/upvote")
def upvote_citizen_concern(concern_id: int, db: Session = Depends(get_db)):
    concern = db.query(CitizenConcern).filter(CitizenConcern.id == concern_id).first()
    if not concern:
        raise HTTPException(status_code=404, detail="Concern record not found")
    concern.upvotes += 1
    db.commit()
    return {"id": concern.id, "upvotes": concern.upvotes}


@router.put("/concerns/{concern_id}/respond", response_model=CitizenConcernSchema)
def respond_to_citizen_concern(concern_id: int, data: ConcernResponseSchema, db: Session = Depends(get_db)):
    concern = db.query(CitizenConcern).filter(CitizenConcern.id == concern_id).first()
    if not concern:
        raise HTTPException(status_code=404, detail="Concern record not found")

    concern.status = data.status
    concern.official_response = data.official_response
    concern.response_officer = data.response_officer or "Superintending Engineer / Public Oversight Officer"
    if data.status == "Resolved":
        concern.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(concern)
    return concern
