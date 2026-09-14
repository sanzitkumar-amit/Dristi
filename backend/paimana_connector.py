"""
PAIMANA / OCMS Data Connector
=============================
Simulates fetching live project data from India's government infrastructure
monitoring systems: PAIMANA (Project Appraisal, Infrastructure Management
and Network Analysis) and OCMS (Online Contract Management System).

When real API access is granted, replace the `_simulate_*` functions with
actual HTTP calls to the government endpoints.
"""

import random
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict


# ── Realistic Master Data Pools ──────────────────────────────────────────────

_DEPARTMENTS = [
    "Highways & Transport", "Railways", "Water Resources", "Urban Development",
    "Renewable Energy", "Smart Cities Mission", "Jal Jeevan Mission",
    "PMAY (Housing)", "Port & Shipping", "Defence Infrastructure",
    "Telecom & Digital India", "Health Infrastructure", "Education Infrastructure"
]

_STATES = [
    ("Gujarat", ["Ahmedabad", "Vadodara", "Surat", "Rajkot", "Gandhinagar"]),
    ("Maharashtra", ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"]),
    ("Tamil Nadu", ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy"]),
    ("Karnataka", ["Bengaluru", "Mysuru", "Mangalore", "Hubli", "Belgaum"]),
    ("Uttar Pradesh", ["Lucknow", "Varanasi", "Agra", "Kanpur", "Noida"]),
    ("Madhya Pradesh", ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"]),
    ("Rajasthan", ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"]),
    ("Assam", ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur"]),
    ("Odisha", ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Berhampur"]),
    ("West Bengal", ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol"]),
    ("Kerala", ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kannur"]),
    ("Punjab", ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"]),
]

_CONTRACTORS = [
    "L&T Infrastructure", "Dilip Buildcon Ltd", "NCC Ltd", "Ashoka Buildcon",
    "AFCONS Infrastructure", "Tata Projects", "Megha Engineering (MEIL)",
    "JMC Projects", "Hindustan Construction Co.", "Shapoorji Pallonji",
    "IRB Infrastructure", "PNC Infratech", "Sadbhav Engineering",
    "GR Infraprojects", "KNR Constructions", "HG Infra Engineering",
    "Welspun Enterprises", "APCO Infratech", "Oriental Structural Engineers",
    "BL Kashyap & Sons"
]

_PROJECT_TYPES = {
    "Highways & Transport": [
        "National Highway 6-Lane Expansion",
        "Expressway Corridor Phase",
        "State Highway Bypass Construction",
        "ROB/RUB Grade Separator",
        "Flyover & Elevated Road",
        "Greenfield Access-Controlled Highway"
    ],
    "Railways": [
        "Railway Line Doubling Project",
        "Station Modernization & Platform Extension",
        "High-Speed Rail Corridor Segment",
        "Railway Electrification Phase",
        "Freight Corridor Logistics Hub"
    ],
    "Water Resources": [
        "Dam Rehabilitation & Improvement",
        "Irrigation Canal Modernization",
        "Flood Control Embankment Works",
        "River Interlinking Segment",
        "Drinking Water Treatment Plant"
    ],
    "Urban Development": [
        "Metro Rail Extension Corridor",
        "Smart City Area-Based Development",
        "Urban Road Widening & Drainage",
        "Affordable Housing Township",
        "Sewerage Treatment Plant"
    ],
    "Renewable Energy": [
        "Solar Park Grid-Connected Plant",
        "Wind Farm Installation Phase",
        "Hybrid RE Park Development",
        "Substation Grid Augmentation",
        "Green Hydrogen Pilot Unit"
    ],
    "Smart Cities Mission": [
        "Integrated Command & Control Centre",
        "Smart Street Lighting Network",
        "Public Wi-Fi & Digital Infrastructure",
        "Smart Water Metering Network",
        "Urban Surveillance & Safety Grid"
    ],
}

_REMARKS_POOL = [
    "Land acquisition completed for 85% of corridor. ROW disputes pending in 2 villages. Contractor mobilized heavy earth-moving equipment.",
    "Work progressing ahead of schedule. Quality audit passed by Third Party (IIT Madras). No major bottlenecks.",
    "Severe monsoon flooding damaged approach road embankment. Reconstruction underway. Insurance claim filed.",
    "Contractor requested cost escalation due to 28% steel price surge. Ministry review pending. Payment disbursement delayed by 3 months.",
    "Environmental clearance obtained after 14-month delay. Forest diversion approved for 12.5 hectares. Wildlife underpass design finalized.",
    "Court stay order on 3km stretch due to tribal land dispute. Arbitration initiated. Work halted in affected zone since March 2025.",
    "Bridge foundation piling completed. Superstructure girder launching scheduled for next quarter. Concrete grade testing satisfactory.",
    "Slow progress due to labor shortage post-festival season. Subcontractor performance below benchmark. Show-cause notice issued.",
    "All milestones on track. Financial utilization at 92%. Quality parameters within IRC specification tolerance. Rated 'A' grade by PMC.",
    "Material supply chain disruption for bitumen and cement. Alternate vendor empaneled. 15-day schedule slip expected.",
    "Design revision ordered by Chief Engineer due to geological survey revealing weak subsoil strata. DPR amendment under review.",
    "Aggressive cost overrun detected. Budget utilization exceeds physical progress by 22%. Financial audit recommended.",
    "Tunnel boring machine deployed. TBM advance rate satisfactory at 12m/day. Safety compliance verified by DGMS inspectors.",
    "Community resistance reported near project site. Public hearing conducted. Grievance redressal cell activated.",
    "Payment to contractor delayed by 6 months. Mobilization advance recovery stalled. Contractor threatened work stoppage.",
    "Project inspection by Secretary-level officer completed. Directed acceleration of critical path activities. Monthly review mandated.",
    "Structural load testing of viaduct spans completed successfully. Deflection within permissible limits per IRC:112.",
    "Embankment compaction quality substandard in 4km stretch. Re-compaction ordered. Penalty clause invoked.",
    "Smart tolling equipment procurement tender floated. Expected deployment in Q3. RFID-based toll collection system designed.",
    "Water table encountered at shallow depth during excavation. Dewatering operations commenced. Foundation design modified."
]

_TERRAIN_TYPES = [
    "Urban Plain", "Urban Plain / River Crossing", "Hilly Ghats / Mountainous",
    "Coastal Slope", "River Basin / Floodplain", "Desert / Arid Zone",
    "Forest / Wildlife Corridor", "Plateau / Deccan Trap", "Deltaic / Marshy"
]


def _generate_paimana_code(dept: str, idx: int, year: int = 2024) -> str:
    """Generate a realistic PAIMANA project code."""
    dept_codes = {
        "Highways & Transport": "NHW", "Railways": "RLY", "Water Resources": "WRD",
        "Urban Development": "URB", "Renewable Energy": "REN", "Smart Cities Mission": "SCM",
        "Jal Jeevan Mission": "JJM", "PMAY (Housing)": "PMY", "Port & Shipping": "PRT",
        "Defence Infrastructure": "DEF", "Telecom & Digital India": "TDI",
        "Health Infrastructure": "HLT", "Education Infrastructure": "EDU"
    }
    code = dept_codes.get(dept, "GEN")
    return f"PAIMANA-{code}-{year}-{idx:04d}"


def _generate_ocms_ref(contractor: str, idx: int) -> str:
    """Generate a realistic OCMS contract reference number."""
    h = hashlib.md5(contractor.encode()).hexdigest()[:4].upper()
    return f"OCMS/CNT/{h}/{idx:05d}"


def fetch_paimana_projects(count: int = 20) -> List[Dict]:
    """
    Simulate fetching project monitoring data from the PAIMANA system.
    Returns data in PAIMANA's native column format.
    
    In production, this would be:
        response = requests.get("https://paimana.gov.in/api/v2/projects", headers=auth_headers)
        return response.json()["projects"]
    """
    random.seed(int(datetime.now().timestamp()) % 10000)
    projects = []

    for i in range(count):
        dept = random.choice(_DEPARTMENTS)
        state_name, districts = random.choice(_STATES)
        district = random.choice(districts)

        # Get project type name
        type_pool = _PROJECT_TYPES.get(dept, _PROJECT_TYPES["Highways & Transport"])
        proj_type = random.choice(type_pool)

        budget = round(random.uniform(80.0, 6500.0), 1)
        planned_dur = random.randint(12, 60)
        elapsed = random.randint(3, min(planned_dur + 12, 72))
        
        # Realistic progress with some lagging projects
        expected_progress = min(100.0, (elapsed / planned_dur) * 100)
        lag_factor = random.uniform(0.4, 1.15)
        progress = round(min(99.5, max(3.0, expected_progress * lag_factor)), 1)
        
        # Financial spending (some projects overspend relative to progress)
        spend_ratio = (progress / 100.0) * random.uniform(0.85, 1.35)
        spent = round(budget * min(1.5, spend_ratio), 1)

        contractor = random.choice(_CONTRACTORS)
        terrain = random.choice(_TERRAIN_TYPES)
        landslide = round(random.uniform(0, 85), 1) if "Hilly" in terrain or "Coastal" in terrain or "Mountain" in terrain else round(random.uniform(0, 15), 1)

        lat = round(random.uniform(8.5, 35.0), 4)
        lng = round(random.uniform(68.0, 97.0), 4)

        paimana_code = _generate_paimana_code(dept, 400 + i)
        ocms_ref = _generate_ocms_ref(contractor, 10000 + i)

        start_date = datetime.now() - timedelta(days=elapsed * 30)
        target_date = start_date + timedelta(days=planned_dur * 30)

        projects.append({
            # PAIMANA native column names (with units, as they appear in real exports)
            "PAIMANA Project Code": paimana_code,
            "OCMS Contract Ref": ocms_ref,
            "Project Name / Title": f"{proj_type} — {district} ({state_name})",
            "Administrative Ministry / Department": dept,
            "State / UT": state_name,
            "District": district,
            "Location / Site": f"{district}, {state_name}",
            "Executing Agency / Contractor": contractor,
            "Sanctioned Cost (Cr INR)": budget,
            "Expenditure to Date (Cr INR)": spent,
            "Financial Progress (%)": round((spent / budget) * 100, 1) if budget > 0 else 0.0,
            "Scheduled Duration (Months)": planned_dur,
            "Time Elapsed (Months)": elapsed,
            "Physical Progress (%)": progress,
            "Original Start Date": start_date.strftime("%Y-%m-%d"),
            "Target Completion Date": target_date.strftime("%Y-%m-%d"),
            "Revised Completion Date": (target_date + timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d") if progress < 70 else target_date.strftime("%Y-%m-%d"),
            "Monitoring Remarks / Inspector Notes": random.choice(_REMARKS_POOL),
            "Terrain Classification": terrain,
            "Landslide Hazard Index (%)": landslide,
            "GPS Coordinates": f"{lat}° N, {lng}° E",
            "PAIMANA Data Quality Flag": random.choice(["Green", "Green", "Green", "Amber", "Red"]),
            "Last OCMS Sync Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        })

    return projects


def fetch_ocms_contracts(count: int = 10) -> List[Dict]:
    """
    Simulate fetching contract management data from the OCMS system.
    Returns data in OCMS's native column format.
    
    In production, this would be:
        response = requests.get("https://ocms.gov.in/api/contracts", headers=auth_headers)
        return response.json()["contracts"]
    """
    random.seed(int(datetime.now().timestamp()) % 5000 + 999)
    contracts = []

    for i in range(count):
        dept = random.choice(_DEPARTMENTS[:6])
        state_name, districts = random.choice(_STATES[:8])
        district = random.choice(districts)
        contractor = random.choice(_CONTRACTORS)
        type_pool = _PROJECT_TYPES.get(dept, _PROJECT_TYPES["Highways & Transport"])
        proj_type = random.choice(type_pool)

        budget = round(random.uniform(150.0, 4500.0), 1)
        planned_dur = random.randint(18, 48)
        elapsed = random.randint(6, min(planned_dur + 6, 60))
        expected_progress = min(100.0, (elapsed / planned_dur) * 100)
        lag = random.uniform(0.5, 1.1)
        progress = round(min(99.0, max(5.0, expected_progress * lag)), 1)
        spent = round(budget * (progress / 100.0) * random.uniform(0.9, 1.25), 1)

        contracts.append({
            "OCMS Contract Ref": _generate_ocms_ref(contractor, 20000 + i),
            "PAIMANA Link Code": _generate_paimana_code(dept, 800 + i),
            "Work Description": f"{proj_type} — {district} Sector ({state_name})",
            "Ministry / Dept": dept,
            "State": state_name,
            "District": district,
            "Site Location": f"{district}, {state_name}",
            "Contractor / Agency": contractor,
            "Contract Value (Cr INR)": budget,
            "Cumulative Expenditure (Cr INR)": spent,
            "Planned Duration (Months)": planned_dur,
            "Months Elapsed": elapsed,
            "Cumulative Physical Progress (%)": progress,
            "Contract Start": (datetime.now() - timedelta(days=elapsed * 30)).strftime("%Y-%m-%d"),
            "Stipulated Completion": (datetime.now() - timedelta(days=elapsed * 30) + timedelta(days=planned_dur * 30)).strftime("%Y-%m-%d"),
            "Inspector Remarks": random.choice(_REMARKS_POOL),
            "Contract Status": random.choice(["Active", "Active", "Active", "Under Review", "Extension Approved"]),
        })

    return contracts


def get_connector_status() -> Dict:
    """Return the simulated health status of PAIMANA/OCMS connections."""
    return {
        "paimana": {
            "endpoint": "https://paimana.gov.in/api/v2/projects",
            "status": "Connected (Simulated)",
            "protocol": "REST API v2 / JSON",
            "auth_method": "OAuth 2.0 Bearer Token (Simulated)",
            "data_format": "PAIMANA Standard Export Schema v4.2",
            "last_heartbeat": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "latency_ms": random.randint(120, 450),
        },
        "ocms": {
            "endpoint": "https://ocms.gov.in/api/contracts",
            "status": "Connected (Simulated)",
            "protocol": "REST API v1 / JSON",
            "auth_method": "API Key + IP Whitelist (Simulated)",
            "data_format": "OCMS Contract Schema v3.1",
            "last_heartbeat": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "latency_ms": random.randint(80, 350),
        }
    }
