import os
import sys

# Test script to verify database creation, seeding, and all transparency endpoints
from database import engine, Base, SessionLocal
from models import Project, ProjectMilestone, VendorProposal, CitizenFeedback, CitizenConcern
from seed_data import seed_initial_data
from routers.transparency import (
    get_transparency_overview, get_transparency_projects,
    get_transparency_project_dossier, publish_government_tender,
    submit_vendor_proposal, review_vendor_proposal,
    submit_citizen_feedback, raise_citizen_concern,
    update_milestone_progress
)
from schemas import (
    TenderPublishSchema, ProposalSubmitSchema, ProposalStatusUpdateSchema,
    FeedbackCreateSchema, ConcernCreateSchema, MilestoneUpdateSchema
)

def run_tests():
    print("1. Re-creating tables...")
    # Drop and recreate for fresh clean test
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("2. Seeding initial data...")
        seed_initial_data(db)
        
        projects = db.query(Project).all()
        print(f"Projects seeded: {len(projects)}")
        milestones = db.query(ProjectMilestone).all()
        print(f"Milestones seeded: {len(milestones)}")
        proposals = db.query(VendorProposal).all()
        print(f"Proposals seeded: {len(proposals)}")
        feedbacks = db.query(CitizenFeedback).all()
        print(f"Feedbacks seeded: {len(feedbacks)}")
        concerns = db.query(CitizenConcern).all()
        print(f"Concerns seeded: {len(concerns)}")
        
        print("3. Testing Overview API...")
        overview = get_transparency_overview(db)
        print(f"Overview Trust Index: {overview.community_trust_index}, Total Funds: INR {overview.total_public_funds_cr} Cr, Open Tenders: {overview.open_tenders_count}")

        print("4. Testing Projects List API...")
        proj_list = get_transparency_projects(db=db)
        print(f"Projects returned: {len(proj_list)}")

        print("5. Testing Government Publish Tender...")
        new_tender = publish_government_tender(TenderPublishSchema(
            project_code="PRJ-TEST-999",
            name="Smart Urban Greenway Corridor",
            department="Urban Development",
            location="Pune Central",
            budget_cr=350.0,
            planned_duration_months=18,
            start_date="2026-10-01",
            target_completion_date="2028-04-01",
            purpose="Develop an eco-friendly pedestrian and bicycle green corridor.",
            specifications="Permeable pavers, LED solar lighting, automated misting systems.",
            bidding_deadline="2026-10-31",
            min_vendor_experience_years=4,
            tender_category="Urban Parks & Greenways"
        ), db=db)
        print(f"New tender published with ID: {new_tender.id}, Status: {new_tender.tender_status}")

        print("6. Testing Vendor Proposal Submission...")
        prop = submit_vendor_proposal(new_tender.id, ProposalSubmitSchema(
            vendor_name="GreenSpaces Infra JV",
            vendor_email="bids@greenspaces.in",
            vendor_phone="+91 99887 76655",
            vendor_registration_no="GSTIN27PUNE9988Z1",
            years_of_experience=8,
            bid_amount_cr=335.0,
            proposed_duration_months=16,
            technical_proposal="Rapid pre-cast permeable paving and native landscaping approach.",
            key_personnel="Lead Landscape Architect, Urban Civil Lead"
        ), db=db)
        print(f"Vendor proposal submitted with ID: {prop.id}, Status: {prop.status}")

        print("7. Testing Government Proposal Awarding...")
        awarded_prop = review_vendor_proposal(prop.id, ProposalStatusUpdateSchema(
            status="Awarded",
            decision_notes="Selected based on lowest competitive bid and green certification."
        ), db=db)
        print(f"Proposal awarded. Project contractor now: {new_tender.contractor}, Tender Status: {new_tender.tender_status}")

        print("8. Testing Citizen Feedback & Rating...")
        fb = submit_citizen_feedback(new_tender.id, FeedbackCreateSchema(
            citizen_name="Aarav Joshi",
            citizen_location="Shivajinagar Pune",
            rating_quality=5,
            rating_speed=4,
            rating_safety=5,
            aspect="Work Quality",
            comment="Excellent transparency and proactive green corridor initiative!"
        ), db=db)
        print(f"Citizen feedback submitted with ID: {fb.id}, Rating: {fb.rating_overall}")

        print("9. Testing Citizen Concern & Whistleblower...")
        concern = raise_citizen_concern(new_tender.id, ConcernCreateSchema(
            citizen_name="Kavita Deshmukh",
            concern_type="Public Inconvenience",
            title="Tree relocation safety audit requested",
            description="Ensure old banyan trees along the greenway sector are preserved or safely translocated.",
            location_detail="Sector 2 near Riverfront",
            severity="Medium"
        ), db=db)
        print(f"Citizen concern logged with ID: {concern.id}, Status: {concern.status}")

        print("10. Testing Milestone Update...")
        first_ms = new_tender.milestones[0]
        updated_ms = update_milestone_progress(first_ms.id, MilestoneUpdateSchema(
            status="Verified by Auditor",
            progress_pct=100.0,
            spent_budget_cr=50.0,
            official_update_notes="Site survey completed and environmental tree preservation tag verified."
        ), db=db)
        print(f"Milestone {updated_ms.id} updated to {updated_ms.status}, Progress: {updated_ms.progress_pct}%")

        print("ALL BACKEND CIVIC TRANSPARENCY TESTS PASSED SUCCESSFULLY!")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
