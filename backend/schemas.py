from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class RiskFactorItem(BaseModel):
    factor: str
    impact_score: float  # 0 to 100
    category: str       # Cost, Schedule, NLP, Operational
    description: str

class RiskScoreSchema(BaseModel):
    cost_risk_score: float
    cost_risk_level: str
    predicted_cost_overrun_pct: float
    schedule_risk_score: float
    schedule_risk_level: str
    predicted_delay_months: float
    overall_risk_score: float
    overall_risk_level: str
    top_risk_factors: List[RiskFactorItem]
    calculated_at: Optional[datetime]

    class Config:
        from_attributes = True

class RemarkInsightSchema(BaseModel):
    extracted_keywords: List[str]
    risk_flags: List[str]
    sentiment_score: float
    risk_weight_addition: float
    analyzed_at: Optional[datetime]

    class Config:
        from_attributes = True

class HistoricalProgressSchema(BaseModel):
    month: int
    planned_progress_pct: float
    actual_progress_pct: float
    planned_cost_cr: float
    actual_cost_cr: float

    class Config:
        from_attributes = True

class AlertSchema(BaseModel):
    id: int
    project_id: int
    title: str
    severity: str
    category: str
    message: str
    is_read: bool
    created_at: datetime
    project_name: Optional[str] = None
    project_code: Optional[str] = None

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    project_code: str
    name: str
    department: str
    location: str
    contractor: str
    budget_cr: float
    spent_cr: float
    planned_duration_months: int
    elapsed_months: int
    current_progress_pct: float
    start_date: Optional[str] = ""
    target_completion_date: Optional[str] = ""
    remarks: Optional[str] = ""
    purpose: Optional[str] = ""
    specifications: Optional[str] = ""
    design_doc_url: Optional[str] = ""
    tender_status: Optional[str] = "In Execution"
    bidding_deadline: Optional[str] = ""
    min_vendor_experience_years: Optional[int] = 3
    tender_category: Optional[str] = "Civil Infrastructure"
    landslide_risk_pct: Optional[float] = 0.0
    terrain_type: Optional[str] = "Plain / Urban"
    mybharat_location_id: Optional[str] = ""
    mybharat_district: Optional[str] = ""
    mybharat_state: Optional[str] = ""
    mybharat_coordinates: Optional[str] = ""

class ProjectCreate(ProjectBase):
    pass

class ProjectMilestoneSchema(BaseModel):
    id: int
    project_id: int
    milestone_number: int
    title: str
    description: Optional[str] = ""
    target_date: Optional[str] = ""
    completion_date: Optional[str] = ""
    allocated_budget_cr: float
    spent_budget_cr: float
    status: str
    progress_pct: float
    official_update_notes: Optional[str] = ""
    evidence_media_url: Optional[str] = ""
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MilestoneCreateSchema(BaseModel):
    milestone_number: int
    title: str
    description: Optional[str] = ""
    target_date: Optional[str] = ""
    allocated_budget_cr: float = 0.0

class MilestoneUpdateSchema(BaseModel):
    status: Optional[str] = None
    progress_pct: Optional[float] = None
    spent_budget_cr: Optional[float] = None
    completion_date: Optional[str] = None
    official_update_notes: Optional[str] = None

class VendorProposalSchema(BaseModel):
    id: int
    project_id: int
    vendor_name: str
    vendor_email: str
    vendor_phone: Optional[str] = ""
    vendor_registration_no: Optional[str] = ""
    years_of_experience: int
    bid_amount_cr: float
    proposed_duration_months: int
    technical_proposal: Optional[str] = ""
    key_personnel: Optional[str] = ""
    financial_capacity_score: float
    compliance_certified: bool
    status: str
    decision_notes: Optional[str] = ""
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProposalSubmitSchema(BaseModel):
    vendor_name: str
    vendor_email: str
    vendor_phone: Optional[str] = ""
    vendor_registration_no: Optional[str] = ""
    years_of_experience: int = 5
    bid_amount_cr: float
    proposed_duration_months: int
    technical_proposal: str
    key_personnel: Optional[str] = ""
    compliance_certified: bool = True

class ProposalStatusUpdateSchema(BaseModel):
    status: str # Shortlisted, Awarded, Rejected, Under Review
    decision_notes: Optional[str] = ""

class CitizenFeedbackSchema(BaseModel):
    id: int
    project_id: int
    citizen_name: str
    citizen_location: str
    is_verified_resident: bool
    rating_quality: int
    rating_speed: int
    rating_safety: int
    rating_overall: float
    aspect: str
    comment: str
    sentiment: str
    upvotes: int
    created_at: datetime

    class Config:
        from_attributes = True

class FeedbackCreateSchema(BaseModel):
    citizen_name: str = "Verified Citizen"
    citizen_location: str = "Local Resident"
    rating_quality: int = 5
    rating_speed: int = 4
    rating_safety: int = 5
    aspect: str = "Work Quality"
    comment: str

class CitizenConcernSchema(BaseModel):
    id: int
    project_id: int
    citizen_name: str
    citizen_email: Optional[str] = ""
    concern_type: str
    title: str
    description: str
    location_detail: Optional[str] = ""
    severity: str
    status: str
    upvotes: int
    official_response: Optional[str] = ""
    response_officer: Optional[str] = ""
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConcernCreateSchema(BaseModel):
    citizen_name: str = "Concerned Citizen"
    citizen_email: Optional[str] = ""
    concern_type: str = "Substandard Materials"
    title: str
    description: str
    location_detail: Optional[str] = ""
    severity: str = "Medium"

class ConcernResponseSchema(BaseModel):
    status: str # Under Investigation, Action Taken, Resolved, Dismissed
    official_response: str
    response_officer: str = "Chief Project Oversight Officer"

class TenderPublishSchema(BaseModel):
    project_code: str
    name: str
    department: str
    location: str
    budget_cr: float
    planned_duration_months: int
    start_date: Optional[str] = ""
    target_completion_date: Optional[str] = ""
    purpose: str
    specifications: str
    design_doc_url: Optional[str] = ""
    bidding_deadline: str
    min_vendor_experience_years: int = 3
    tender_category: str = "Civil Infrastructure"
    initial_milestones: Optional[List[MilestoneCreateSchema]] = []

class ProjectSchema(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    risk_score: Optional[RiskScoreSchema] = None
    remark_insight: Optional[RemarkInsightSchema] = None
    alerts: Optional[List[AlertSchema]] = []
    historical_progress: Optional[List[HistoricalProgressSchema]] = []
    milestones: Optional[List[ProjectMilestoneSchema]] = []
    proposals: Optional[List[VendorProposalSchema]] = []
    feedbacks: Optional[List[CitizenFeedbackSchema]] = []
    concerns: Optional[List[CitizenConcernSchema]] = []

    class Config:
        from_attributes = True

class ProjectListItem(BaseModel):
    id: int
    project_code: str
    name: str
    department: str
    location: str
    budget_cr: float
    spent_cr: float
    planned_duration_months: int
    elapsed_months: int
    current_progress_pct: float
    tender_status: Optional[str] = "In Execution"
    bidding_deadline: Optional[str] = ""
    cost_risk_score: float
    schedule_risk_score: float
    overall_risk_score: float
    overall_risk_level: str
    predicted_delay_months: float
    landslide_risk_pct: Optional[float] = 0.0
    terrain_type: Optional[str] = "Plain / Urban"
    mybharat_location_id: Optional[str] = ""
    mybharat_district: Optional[str] = ""
    mybharat_state: Optional[str] = ""
    mybharat_coordinates: Optional[str] = ""

    class Config:
        from_attributes = True

class TransparencyProjectListItem(BaseModel):
    id: int
    project_code: str
    name: str
    department: str
    location: str
    contractor: Optional[str] = ""
    budget_cr: float
    spent_cr: float
    planned_duration_months: int
    elapsed_months: int
    current_progress_pct: float
    tender_status: str
    bidding_deadline: Optional[str] = ""
    tender_category: Optional[str] = ""
    purpose: Optional[str] = ""
    milestones_total: int
    milestones_completed: int
    proposals_count: int
    citizen_rating_avg: float
    citizen_feedbacks_count: int
    open_concerns_count: int
    overall_risk_level: str
    overall_risk_score: float

    class Config:
        from_attributes = True

class AnalyticsSummary(BaseModel):
    total_projects: int
    total_budget_cr: float
    total_spent_cr: float
    high_risk_projects_count: int
    medium_risk_projects_count: int
    low_risk_projects_count: int
    average_risk_score: float
    predicted_total_delay_months: float
    department_risk_breakdown: List[dict]
    risk_distribution: dict

class TransparencyOverviewSchema(BaseModel):
    total_public_projects: int
    total_public_funds_cr: float
    total_spent_funds_cr: float
    open_tenders_count: int
    active_construction_count: int
    completed_projects_count: int
    total_proposals_received: int
    awarded_contracts_count: int
    citizen_feedbacks_count: int
    citizen_average_rating: float
    total_concerns_raised: int
    concerns_resolved_count: int
    concerns_resolution_rate_pct: float
    community_trust_index: float
    recent_activity: List[dict]


class SimulationRequest(BaseModel):
    budget_cr: float
    spent_cr: float
    planned_duration_months: int
    elapsed_months: int
    current_progress_pct: float
    remarks: Optional[str] = ""

