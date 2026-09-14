"""
Verification test for multi-format document uploads in DRISHTI:
Tests uploading DOCX, JSON, TXT, and CSV formats.
"""
import io
import json
import docx
from fastapi.testclient import TestClient
from main import app
from database import Base, engine, SessionLocal
from seed_data import seed_initial_data

client = TestClient(app)

def test_all_upload_formats():
    print("=========================================================")
    print("   TESTING MULTI-DOCUMENT INGESTION & AI RISK EVALUATION ")
    print("=========================================================")

    # 1. Reset DB
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_initial_data(db)
    db.close()

    # --- Test 1: DOCX Upload ---
    print("\n[1/4] Testing Word Document (.docx) Upload...")
    doc = docx.Document()
    doc.add_heading("State Infrastructure Project Brief", level=1)
    doc.add_paragraph("Project Code: PRJ-DOCX-METRO-01")
    doc.add_paragraph("Project Name: Green Metro Elevated Line Extension")
    doc.add_paragraph("Department: Urban Transit")
    doc.add_paragraph("Location: Bengaluru")
    doc.add_paragraph("Contractor: Afcons Infrastructure")
    doc.add_paragraph("Budget: 1250.0 Cr")
    doc.add_paragraph("Spent: 920.0 Cr")
    doc.add_paragraph("Planned Duration: 36 months")
    doc.add_paragraph("Elapsed Months: 30 months")
    doc.add_paragraph("Current Progress: 60.0%")
    doc.add_paragraph("Remarks: Pier construction completed. Delay in viaduct girder launching due to utility shifting.")

    doc_buf = io.BytesIO()
    doc.save(doc_buf)
    doc_buf.seek(0)

    files = {"file": ("state_metro_project.docx", doc_buf, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    res = client.post("/api/projects/upload", files=files)
    assert res.status_code == 200, f"DOCX upload failed: {res.text}"
    docx_res = res.json()
    assert docx_res["total_processed"] >= 1, "Failed to parse project from DOCX"
    print(f"  -> Word Doc Upload Success! Processed: {docx_res['total_processed']} projects. Avg Risk: {docx_res['summary']['average_risk_score']}")

    # --- Test 2: JSON Upload ---
    print("\n[2/4] Testing JSON Dataset (.json) Upload...")
    json_data = [
        {
            "project_code": "PRJ-JSON-SOLAR-02",
            "name": "Ultra Mega Solar Park Phase III",
            "department": "Renewable Energy",
            "location": "Bhadla, Rajasthan",
            "contractor": "Tata Power Solar",
            "budget_cr": 950.0,
            "spent_cr": 350.0,
            "planned_duration_months": 24,
            "elapsed_months": 8,
            "current_progress_pct": 45.0,
            "remarks": "Inverter substation foundation work complete. Module shipment received on time."
        }
    ]
    json_buf = io.BytesIO(json.dumps(json_data).encode('utf-8'))
    files = {"file": ("solar_projects.json", json_buf, "application/json")}
    res = client.post("/api/projects/upload", files=files)
    assert res.status_code == 200, f"JSON upload failed: {res.text}"
    json_res = res.json()
    assert json_res["total_processed"] >= 1, "Failed to parse project from JSON"
    print(f"  -> JSON Upload Success! Processed: {json_res['total_processed']} projects. Risk Level: {json_res['project_results'][0]['overall_risk_level']}")

    # --- Test 3: Semi-Structured TXT Upload ---
    print("\n[3/4] Testing Text Brief (.txt) Upload...")
    txt_content = (
        "Project Code: PRJ-TXT-DAM-03\n"
        "Name: Upper Dam Spillway Modernization\n"
        "Department: Water Resources\n"
        "Location: Maharashtra\n"
        "Contractor: Patel Engineering\n"
        "Budget: 420.0 Cr\n"
        "Spent: 380.0 Cr\n"
        "Duration: 18 months\n"
        "Elapsed: 16 months\n"
        "Progress: 52.0%\n"
        "Remarks: Critical structural cracks detected during pressure tests. Work temporarily halted for safety audit.\n"
    )
    txt_buf = io.BytesIO(txt_content.encode('utf-8'))
    files = {"file": ("dam_inspection.txt", txt_buf, "text/plain")}
    res = client.post("/api/projects/upload", files=files)
    assert res.status_code == 200, f"TXT upload failed: {res.text}"
    txt_res = res.json()
    assert txt_res["total_processed"] >= 1, "Failed to parse project from TXT"
    print(f"  -> Text Brief Upload Success! Detected Delay: {txt_res['project_results'][0]['predicted_delay_months']} mo, Risk Level: {txt_res['project_results'][0]['overall_risk_level']}")

    # --- Test 4: Tabular CSV Upload ---
    print("\n[4/4] Testing Tabular CSV (.csv) Upload...")
    csv_content = (
        "project_code,name,department,location,contractor,budget_cr,spent_cr,planned_duration_months,elapsed_months,current_progress_pct,remarks\n"
        "PRJ-CSV-HW-04,Outer Ring Expressway Link,Highways & Transport,Hyderabad,Navayuga Engineering,1800.0,1200.0,30,22,78.0,Toll plaza construction ongoing.\n"
    )
    csv_buf = io.BytesIO(csv_content.encode('utf-8'))
    files = {"file": ("expressway.csv", csv_buf, "text/csv")}
    res = client.post("/api/projects/upload", files=files)
    assert res.status_code == 200, f"CSV upload failed: {res.text}"
    csv_res = res.json()
    assert csv_res["total_processed"] >= 1, "Failed to parse project from CSV"
    print(f"  -> CSV Upload Success! Processed: {csv_res['total_processed']} projects.")

    print("\n=========================================================")
    print("   ALL MULTI-FORMAT DOCUMENT UPLOAD TESTS PASSED!        ")
    print("=========================================================")

if __name__ == "__main__":
    test_all_upload_formats()
