from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_code = Column(String(50), unique=True, index=True)
    name = Column(String(255), index=True)
    department = Column(String(100), index=True)
    location = Column(String(150))
    contractor = Column(String(150))
    
    budget_cr = Column(Float, nullable=False)
    spent_cr = Column(Float, default=0.0)
    planned_duration_months = Column(Integer, nullable=False)
    elapsed_months = Column(Integer, default=0)
    current_progress_pct = Column(Float, default=0.0)
    
    start_date = Column(String(20))
    target_completion_date = Column(String(20))
    remarks = Column(Text, default="")
    
    # Transparency & Public Tender Fields
    purpose = Column(Text, default="")
    specifications = Column(Text, default="")
    design_doc_url = Column(String(255), default="")
    tender_status = Column(String(50), default="In Execution") # Draft, Open for Bids, Evaluation, Contract Awarded, In Execution, Completed, Under Audit
    bidding_deadline = Column(String(30), default="")
    min_vendor_experience_years = Column(Integer, default=3)
    tender_category = Column(String(100), default="Civil Infrastructure")
    
    # Geological & My Bharat Geo-Location Fields
    landslide_risk_pct = Column(Float, default=0.0) # 0 to 100% Landslide / Terrain hazard prediction
    terrain_type = Column(String(100), default="Plain / Urban") # Mountainous Valley, Coastal Slope, Hilly Ghats, River Basin, Urban Plain
    mybharat_location_id = Column(String(50), default="") # e.g. MB-LOC-UTK-402
    mybharat_district = Column(String(100), default="")
    mybharat_state = Column(String(100), default="")
    mybharat_coordinates = Column(String(50), default="")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    risk_score = relationship("RiskScore", back_populates="project", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="project", cascade="all, delete-orphan")
    remark_insight = relationship("RemarkInsight", back_populates="project", uselist=False, cascade="all, delete-orphan")
    historical_progress = relationship("HistoricalProgress", back_populates="project", cascade="all, delete-orphan")
    milestones = relationship("ProjectMilestone", back_populates="project", cascade="all, delete-orphan", order_by="ProjectMilestone.milestone_number")
    proposals = relationship("VendorProposal", back_populates="project", cascade="all, delete-orphan", order_by="VendorProposal.submitted_at.desc()")
    feedbacks = relationship("CitizenFeedback", back_populates="project", cascade="all, delete-orphan", order_by="CitizenFeedback.created_at.desc()")
    concerns = relationship("CitizenConcern", back_populates="project", cascade="all, delete-orphan", order_by="CitizenConcern.created_at.desc()")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    
    cost_risk_score = Column(Float, default=0.0)
    cost_risk_level = Column(String(20), default="Low")
    predicted_cost_overrun_pct = Column(Float, default=0.0)
    
    schedule_risk_score = Column(Float, default=0.0)
    schedule_risk_level = Column(String(20), default="Low")
    predicted_delay_months = Column(Float, default=0.0)
    
    overall_risk_score = Column(Float, default=0.0)
    overall_risk_level = Column(String(20), default="Low")
    
    top_risk_factors = Column(JSON, default=list)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="risk_score")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    title = Column(String(255))
    severity = Column(String(20)) # Critical, High, Warning, Info
    category = Column(String(50)) # Cost, Delay, Remarks, System
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="alerts")


class RemarkInsight(Base):
    __tablename__ = "remark_insights"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    
    extracted_keywords = Column(JSON, default=list)
    risk_flags = Column(JSON, default=list)
    sentiment_score = Column(Float, default=0.0)
    risk_weight_addition = Column(Float, default=0.0)
    analyzed_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="remark_insight")


class HistoricalProgress(Base):
    __tablename__ = "historical_progress"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    month = Column(Integer)
    planned_progress_pct = Column(Float)
    actual_progress_pct = Column(Float)
    planned_cost_cr = Column(Float)
    actual_cost_cr = Column(Float)

    project = relationship("Project", back_populates="historical_progress")


class ProjectMilestone(Base):
    __tablename__ = "project_milestones"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    
    milestone_number = Column(Integer, default=1)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    target_date = Column(String(30), default="")
    completion_date = Column(String(30), default="")
    allocated_budget_cr = Column(Float, default=0.0)
    spent_budget_cr = Column(Float, default=0.0)
    status = Column(String(50), default="Pending") # Pending, In Progress, Under Review, Completed, Verified by Auditor
    progress_pct = Column(Float, default=0.0)
    official_update_notes = Column(Text, default="")
    evidence_media_url = Column(String(255), default="")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="milestones")


class VendorProposal(Base):
    __tablename__ = "vendor_proposals"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    
    vendor_name = Column(String(200), nullable=False)
    vendor_email = Column(String(150), nullable=False)
    vendor_phone = Column(String(50), default="")
    vendor_registration_no = Column(String(100), default="") # GSTIN / CIN / License
    years_of_experience = Column(Integer, default=5)
    bid_amount_cr = Column(Float, nullable=False)
    proposed_duration_months = Column(Integer, nullable=False)
    technical_proposal = Column(Text, default="")
    key_personnel = Column(String(255), default="")
    financial_capacity_score = Column(Float, default=85.0)
    compliance_certified = Column(Boolean, default=True)
    status = Column(String(50), default="Submitted") # Submitted, Under Review, Shortlisted, Awarded, Rejected
    decision_notes = Column(Text, default="")
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="proposals")


class CitizenFeedback(Base):
    __tablename__ = "citizen_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    
    citizen_name = Column(String(100), default="Verified Citizen")
    citizen_location = Column(String(100), default="Local Resident")
    is_verified_resident = Column(Boolean, default=True)
    rating_quality = Column(Integer, default=4)
    rating_speed = Column(Integer, default=4)
    rating_safety = Column(Integer, default=4)
    rating_overall = Column(Float, default=4.0)
    aspect = Column(String(50), default="Work Quality") # Work Quality, Pace of Work, Public Safety & Traffic, Environmental Impact, Fund Transparency
    comment = Column(Text, nullable=False)
    sentiment = Column(String(20), default="Positive") # Positive, Neutral, Concern
    upvotes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="feedbacks")


class CitizenConcern(Base):
    __tablename__ = "citizen_concerns"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    
    citizen_name = Column(String(100), default="Concerned Citizen")
    citizen_email = Column(String(150), default="")
    concern_type = Column(String(100), default="Substandard Materials") # Substandard Materials, Unsafe Worksite, Prolonged Delay / Inactivity, Cost Anomaly, Environmental Damage, Noise / Inconvenience
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    location_detail = Column(String(150), default="")
    severity = Column(String(20), default="Medium") # Low, Medium, High, Critical
    status = Column(String(50), default="Open") # Open, Under Investigation, Action Taken, Resolved, Dismissed
    upvotes = Column(Integer, default=1)
    official_response = Column(Text, default="")
    response_officer = Column(String(100), default="")
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="concerns")
