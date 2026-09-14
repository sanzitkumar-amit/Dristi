"""
Comprehensive End-to-End API verification script for DRISHTI.
Tests all endpoints across Projects, Analytics, Alerts, File Upload/Ingestion, and Transparency modules.
"""
import io
import sys
from fastapi.testclient import TestClient
from database import Base, engine, SessionLocal
from seed_data import seed_initial_data
from main import app

client = TestClient(app)

def run_all_checks():
    print("==================================================")
    print("   DRISHTI FULL SYSTEM COMPREHENSIVE TEST SUITE   ")
    print("==================================================")

    # 1. Reset and re-seed database
    print("\n[1/7] Initializing Database & Seed Data...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_initial_data(db)
    db.close()
    print("  -> Database reset and seeded successfully.")

    # 2. Test Root Endpoint
    print("\n[2/7] Testing Root Health Endpoint...")
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print(f"  -> Root status: {res.json()['status']}")

    # 3. Test Analytics & Alerts Endpoints
    print("\n[3/7] Testing Analytics & Alerts Endpoints...")
    res = client.get("/api/analytics/summary")
    assert res.status_code == 200, f"Analytics summary failed: {res.text}"
    summary = res.json()
    assert summary["total_projects"] > 0, "No projects in summary"
    print(f"  -> Total Projects: {summary['total_projects']}, Avg Risk: {summary['average_risk_score']}")

    res = client.get("/api/alerts")
    assert res.status_code == 200, f"Alerts list failed: {res.text}"
    alerts = res.json()
    print(f"  -> Alerts returned: {len(alerts)}")

    if alerts:
        alert_id = alerts[0]["id"]
        res = client.put(f"/api/alerts/{alert_id}/read")
        assert res.status_code == 200, f"Mark alert read failed: {res.text}"
        print(f"  -> Alert {alert_id} marked as read.")

    # 4. Test Projects Endpoints
    print("\n[4/7] Testing Projects Endpoints...")
    res = client.get("/api/projects")
    assert res.status_code == 200, f"Get projects failed: {res.text}"
    projects = res.json()
    assert len(projects) > 0, "No projects returned"
    first_pid = projects[0]["id"]
    print(f"  -> Projects retrieved: {len(projects)}. Testing detail for ID {first_pid}...")

    res = client.get(f"/api/projects/{first_pid}")
    assert res.status_code == 200, f"Get project by ID failed: {res.text}"
    proj_detail = res.json()
    assert proj_detail["name"], "Missing project name"
    print(f"  -> Project Name: {proj_detail['name']}")

    res = client.get(f"/api/projects/{first_pid}/risk-factors")
    assert res.status_code == 200, f"Risk factors failed: {res.text}"
    print(f"  -> Risk factors count: {len(res.json())}")

    # 5. Test File Ingestion (CSV / Excel / TSV / TXT) & Download
    print("\n[5/7] Testing Data Ingestion & Download...")
    res = client.get("/api/projects/sample-csv/download")
    assert res.status_code == 200, f"Sample CSV download failed: {res.text}"
    print("  -> Sample CSV download successful.")

    test_csv = (
        "project_code,name,department,location,contractor,budget_cr,spent_cr,planned_duration_months,elapsed_months,current_progress_pct,remarks\n"
        "PRJ-E2E-TEST-01,Coastal Defense Wall Phase 1,Water Resources,Goa,Marine Works Ltd,450.0,300.0,24,18,65.0,Monsoon delay handled well. Work on schedule.\n"
    )
    files = {"file": ("test_import.csv", io.BytesIO(test_csv.encode("utf-8")), "text/csv")}
    res = client.post("/api/projects/upload", files=files)
    assert res.status_code == 200, f"CSV Upload failed: {res.text}"
    upload_res = res.json()
    assert upload_res["imported_count"] == 1, "CSV project was not imported"
    print(f"  -> CSV Upload success: {upload_res['message']}, Imported: {upload_res['imported_count']}")

    # 6. Test Civic Transparency Endpoints
    print("\n[6/7] Testing Civic Transparency Module...")
    res = client.get("/api/transparency/overview")
    assert res.status_code == 200, f"Transparency overview failed: {res.text}"
    overview = res.json()
    print(f"  -> Transparency Overview: Trust Index={overview['community_trust_index']}, Open Tenders={overview['open_tenders_count']}")

    res = client.get("/api/transparency/projects")
    assert res.status_code == 200, f"Transparency projects failed: {res.text}"
    civic_projects = res.json()
    print(f"  -> Civic Projects Count: {len(civic_projects)}")

    target_civic_pid = civic_projects[0]["id"]
    res = client.get(f"/api/transparency/projects/{target_civic_pid}")
    assert res.status_code == 200, f"Civic project detail failed: {res.text}"
    civic_detail = res.json()
    print(f"  -> Civic Detail for {civic_detail['project_code']}: {len(civic_detail['milestones'])} milestones, {len(civic_detail['proposals'])} proposals")

    # Post a new tender
    new_tender_payload = {
        "project_code": "PRJ-E2E-TENDER-99",
        "name": "Smart City Intelligent Transit Grid",
        "department": "Urban Transport",
        "location": "Ahmedabad",
        "budget_cr": 850.0,
        "planned_duration_months": 30,
        "start_date": "2026-10-01",
        "target_completion_date": "2029-04-01",
        "purpose": "Deploy AI-based traffic management across 120 key intersections.",
        "specifications": "Real-time edge cameras, adaptive signalling, emergency corridor green-wave.",
        "tender_category": "Smart Infrastructure",
        "bidding_deadline": "2026-11-15",
        "min_vendor_experience_years": 5,
        "milestones": [
            {
                "milestone_number": 1,
                "title": "Intersection Fiber Ring & Sensor Layout",
                "target_date": "2027-02-01",
                "allocated_budget_cr": 250.0,
                "description": "Install fiber conduit and camera poles."
            }
        ]
    }
    res = client.post("/api/transparency/projects", json=new_tender_payload)
    assert res.status_code == 200, f"Post tender failed: {res.text}"
    tender_id = res.json()["id"]
    print(f"  -> Created New Public Tender (ID: {tender_id})")

    # Submit Vendor Proposal
    vendor_bid_payload = {
        "vendor_name": "NextGen Traffic AI Solutions",
        "vendor_registration_no": "24AABCN1234F1Z8",
        "vendor_email": "bids@nextgentraffic.in",
        "years_of_experience": 7,
        "bid_amount_cr": 820.0,
        "proposed_duration_months": 28,
        "technical_proposal": "Proprietary deep-learning computer vision edge nodes.",
        "key_personnel": "Project Manager, 4 Systems Engineers",
        "compliance_certified": True
    }
    res = client.post(f"/api/transparency/projects/{tender_id}/apply", json=vendor_bid_payload)
    assert res.status_code == 200, f"Submit proposal failed: {res.text}"
    proposal_id = res.json()["id"]
    print(f"  -> Vendor Submitted Proposal (ID: {proposal_id})")

    # Award the proposal
    res = client.put(f"/api/transparency/proposals/{proposal_id}/status", json={"status": "Awarded", "decision_notes": "Best technical score and competitive cost."})
    assert res.status_code == 200, f"Award proposal failed: {res.text}"
    print(f"  -> Proposal {proposal_id} Awarded by Government.")

    # Submit Citizen Feedback
    feedback_payload = {
        "citizen_name": "Rohan Patel",
        "citizen_location": "Vastrapur, Ahmedabad",
        "rating_quality": 5,
        "rating_speed": 4,
        "rating_safety": 5,
        "aspect": "Design & Innovation",
        "comment": "Much needed project to resolve SG Highway bottleneck!"
    }
    res = client.post(f"/api/transparency/projects/{tender_id}/feedback", json=feedback_payload)
    assert res.status_code == 200, f"Post citizen feedback failed: {res.text}"
    fb_id = res.json()["id"]
    print(f"  -> Citizen Feedback Submitted (ID: {fb_id})")

    # Upvote Feedback
    res = client.post(f"/api/transparency/feedbacks/{fb_id}/upvote")
    assert res.status_code == 200, f"Upvote feedback failed: {res.text}"
    print(f"  -> Feedback {fb_id} Upvoted: {res.json()['upvotes']} upvotes.")

    # Submit Citizen Concern
    concern_payload = {
        "citizen_name": "Priya Shah",
        "citizen_location": "Drive-In Road",
        "concern_type": "Public Inconvenience",
        "title": "Traffic Diversion Plan Needed During Trenching",
        "description": "Please ensure traffic police assistance during trenching on Drive-In Road.",
        "severity": "Medium"
    }
    res = client.post(f"/api/transparency/projects/{tender_id}/concerns", json=concern_payload)
    assert res.status_code == 200, f"Post citizen concern failed: {res.text}"
    concern_id = res.json()["id"]
    print(f"  -> Citizen Concern Logged (ID: {concern_id})")

    # Government Official responds to Concern
    res = client.put(f"/api/transparency/concerns/{concern_id}/respond", json={
        "status": "Resolved",
        "official_response": "Traffic police coordinated diversion schedule approved and signages deployed.",
        "response_officer": "Dy. Commissioner of Police (Traffic)"
    })
    assert res.status_code == 200, f"Respond concern failed: {res.text}"
    print(f"  -> Concern {concern_id} Responded & Marked Resolved.")

    print("\n[7/7] ALL API & WORKFLOW VERIFICATION CHECKS PASSED PERFECTLY!")
    print("==================================================")

if __name__ == "__main__":
    run_all_checks()
