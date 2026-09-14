from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import (
    Project, RiskScore, Alert, RemarkInsight, HistoricalProgress,
    ProjectMilestone, VendorProposal, CitizenFeedback, CitizenConcern
)
from ml_engine import calculate_project_risk
from datetime import datetime, timedelta

def seed_initial_data(db: Session):
    # Check if data already exists
    if db.query(Project).count() > 0:
        return

    sample_projects = [
        {
            "project_code": "PRJ-NHAI-101",
            "name": "Delhi-Mumbai Expressway Corridor Phase 4",
            "department": "Highways & Transport",
            "location": "Vadodara-Kim Sector (Gujarat)",
            "contractor": "L&T Infrastructure",
            "budget_cr": 4200.0,
            "spent_cr": 3570.0,
            "planned_duration_months": 36,
            "elapsed_months": 30,
            "current_progress_pct": 58.0,
            "start_date": "2024-01-15",
            "target_completion_date": "2027-01-15",
            "remarks": "Severe right-of-way land acquisition disputes ongoing in 3 villages. Contractor requested cost escalation due to steel price surge. Payment disbursement delayed by 4 months from ministry.",
            "purpose": "Construct an 8-lane access-controlled greenfield expressway to reduce transit time between industrial hubs by 50% and decongest national transit corridors.",
            "specifications": "IRC:SP:84-2019 specifications, rigid pavement grade M-40, high-tensile steel reinforcements, smart tolling, wildlife underpasses.",
            "design_doc_url": "https://nhai.gov.in/expressways/delhi-mumbai-ph4-blueprint.pdf",
            "tender_status": "In Execution",
            "bidding_deadline": "2023-11-30",
            "min_vendor_experience_years": 8,
            "tender_category": "National Expressways (EPC Mode)",
            "landslide_risk_pct": 18.5,
            "terrain_type": "Urban Plain / River Crossing",
            "mybharat_location_id": "MB-LOC-GUJ-101",
            "mybharat_district": "Vadodara",
            "mybharat_state": "Gujarat",
            "mybharat_coordinates": "22.3072° N, 73.1812° E",
            "milestones": [
                {"num": 1, "title": "Geotechnical Survey & ROW Demarcation", "budget": 420.0, "spent": 420.0, "progress": 100.0, "status": "Verified by Auditor", "notes": "All 110km centerline coordinates verified and land compensation disbursed."},
                {"num": 2, "title": "Earthwork, Embankment & Subgrade Compaction", "budget": 1260.0, "spent": 1260.0, "progress": 100.0, "status": "Verified by Auditor", "notes": "Subgrade density testing passed by Third Party Audit (IIT Roorkee)."},
                {"num": 3, "title": "Pavement Quality Concrete (PQC) & Bridges", "budget": 1680.0, "spent": 1390.0, "progress": 62.0, "status": "In Progress", "notes": "Flyover spans completed; bridge approach earth filling delayed due to local land disputes."},
                {"num": 4, "title": "Advanced Traffic Mgmt Systems & Toll Plazas", "budget": 840.0, "spent": 500.0, "progress": 25.0, "status": "In Progress", "notes": "Fiber optic ducting underway alongside highway shoulder."}
            ],
            "proposals": [
                {"vendor": "L&T Infrastructure", "email": "bids@larsentoubro.com", "bid": 4120.0, "duration": 36, "exp": 25, "status": "Awarded", "notes": "Lowest qualified technical and financial bidder. Full compliance."},
                {"vendor": "Afcons Infrastructure", "email": "tenders@afcons.com", "bid": 4250.0, "duration": 38, "exp": 20, "status": "Shortlisted", "notes": "Strong technical plan but higher financial quote."},
                {"vendor": "Dilip Buildcon Ltd", "email": "infra@dilipbuildcon.co.in", "bid": 4380.0, "duration": 40, "exp": 16, "status": "Rejected", "notes": "Duration exceeded RFP limits."}
            ],
            "feedbacks": [
                {"citizen": "Rajesh Varma", "loc": "Bharuch, Gujarat", "q": 4, "sp": 3, "sa": 4, "aspect": "Work Quality", "comment": "The completed flyovers look sturdy and high quality. However, diversions near Kim junction create heavy dust during evening rush.", "sent": "Positive"},
                {"citizen": "Priya Shah", "loc": "Vadodara Suburbs", "q": 3, "sp": 2, "sa": 3, "aspect": "Pace of Work", "comment": "Construction near Sector 4 has slowed down significantly over the last 2 months. Hope work resumes at full throttle.", "sent": "Neutral"}
            ],
            "concerns": [
                {"name": "Mahesh Patel", "type": "Unsafe Worksite", "title": "Missing Night Reflectors on National Highway Diversion", "desc": "The detour near KM 42 lacks caution blinkers and night reflectors, causing near-miss accidents for daily commuters.", "loc": "KM 42 near Kim Toll Gate", "sev": "High", "status": "Action Taken", "resp": "Highway safety inspector deployed emergency LED blinkers and retro-reflective barricades within 24 hours.", "officer": "NHAI Regional Safety Officer"}
            ]
        },
        {
            "project_code": "PRJ-METRO-204",
            "name": "Mumbai Metro Line 3 Underground Corridor",
            "department": "Urban Transit",
            "location": "Colaba-Bandra-SEEPZ",
            "contractor": "MMRC - HCC JV",
            "budget_cr": 23000.0,
            "spent_cr": 20240.0,
            "planned_duration_months": 60,
            "elapsed_months": 54,
            "current_progress_pct": 72.0,
            "start_date": "2021-06-01",
            "target_completion_date": "2026-06-01",
            "remarks": "Court stay order regarding car shed construction delayed depot work. Tunneling complete but station finishing stalled due to contractor liquidity crunch and labor shortage.",
            "purpose": "Provide a 33.5 km fully underground rapid metro system connecting South Mumbai to International Airport & SEEPZ IT hub, serving 1.7 million passengers daily.",
            "specifications": "Dual tunnel boring (TBM) 5.8m internal dia, 27 underground stations, 25kV AC overhead electrification, CBTC signalling Grade 4 Automation.",
            "design_doc_url": "https://mmrc.gov.in/metro3/tunnel-specifications-rev3.pdf",
            "tender_status": "In Execution",
            "bidding_deadline": "2021-04-15",
            "min_vendor_experience_years": 10,
            "tender_category": "Underground Metro Rail (Turnkey)",
            "landslide_risk_pct": 12.0,
            "terrain_type": "Coastal Urban / Reclaimed Land",
            "mybharat_location_id": "MB-LOC-MAH-204",
            "mybharat_district": "Mumbai",
            "mybharat_state": "Maharashtra",
            "mybharat_coordinates": "18.9389° N, 72.8358° E",
            "milestones": [
                {"num": 1, "title": "Underground Tunneling & TBM Breakthroughs", "budget": 8050.0, "spent": 8050.0, "progress": 100.0, "status": "Verified by Auditor", "notes": "All 17 TBM breakthroughs completed across 33.5 km corridor."},
                {"num": 2, "title": "Station Civil Works & Underground Concourse Slabs", "budget": 6900.0, "spent": 6400.0, "progress": 88.0, "status": "In Progress", "notes": "22 out of 27 stations have roof and concourse slabs completed."},
                {"num": 3, "title": "Track Laying, Third Rail & Power Substation", "budget": 4600.0, "spent": 3800.0, "progress": 65.0, "status": "In Progress", "notes": "Vibration-damping ballastless track installed on Phase 1 section."},
                {"num": 4, "title": "Trainset Testing & Safety Commissioning", "budget": 3450.0, "spent": 1990.0, "progress": 35.0, "status": "In Progress", "notes": "Aarey Depot static testing underway on 8 trainsets."}
            ],
            "proposals": [
                {"vendor": "MMRC - HCC JV", "email": "tenders@hccindia.com", "bid": 22800.0, "duration": 60, "exp": 30, "status": "Awarded", "notes": "Extensive tunnel boring machine experience across high-density urban zones."},
                {"vendor": "L&T - STEC Consortium", "email": "metro@lntecc.com", "bid": 23400.0, "duration": 62, "exp": 28, "status": "Shortlisted", "notes": "High technical score, runner-up bid."}
            ],
            "feedbacks": [
                {"citizen": "Aditya Kulkarni", "loc": "Bandra Kurla Complex", "q": 5, "sp": 4, "sa": 5, "aspect": "Work Quality", "comment": "BKC metro station exterior restoration is top quality. Underground works caused minimal surface disruption.", "sent": "Positive"},
                {"citizen": "Sneha Roy", "loc": "Marol Naka", "q": 4, "sp": 3, "sa": 4, "aspect": "Public Safety & Traffic", "comment": "Pedestrian walkways around station boxes have improved considerably.", "sent": "Positive"}
            ],
            "concerns": [
                {"name": "Farhan Merchant", "type": "Noise / Inconvenience", "title": "Night-time Heavy Crane Operations near Residential Societies", "desc": "Unloading steel girders past midnight creates disturbance for senior citizens and students.", "loc": "Worli Naka Station Box 4", "sev": "Medium", "status": "Resolved", "resp": "Contractor instructed to restrict all heavy crane movements strictly between 7:00 AM and 10:00 PM.", "officer": "MMRC Public Relations Officer"}
            ]
        },
        {
            "project_code": "PRJ-TENDER-801",
            "name": "Smart Coastal Flood Barrier & Tidal Pumping Station",
            "department": "Water Resources",
            "location": "Chennai Coast (Tamil Nadu)",
            "contractor": "Open for Competitive Bidding",
            "budget_cr": 850.0,
            "spent_cr": 0.0,
            "planned_duration_months": 24,
            "elapsed_months": 0,
            "current_progress_pct": 0.0,
            "start_date": "2026-11-01",
            "target_completion_date": "2028-11-01",
            "remarks": "Newly issued RFP. Environmental impact assessment and oceanographic bathymetry survey finalized.",
            "purpose": "Protect 4 coastal wards from extreme storm surge flooding via 6 high-capacity automated tidal gates and 120 cumec drainage pump stations.",
            "specifications": "Marine grade stainless steel 316L hydraulic radial gates, SCADA automated water-level sensors, backup solar & diesel microgrid.",
            "design_doc_url": "https://tenders.gov.in/chennai-flood-barrier-annexure.pdf",
            "tender_status": "Open for Bids",
            "bidding_deadline": "2026-11-30",
            "min_vendor_experience_years": 7,
            "tender_category": "Coastal Marine & Flood Defence (EPC)",
            "landslide_risk_pct": 42.8,
            "terrain_type": "Coastal Slope / Storm Surge Zone",
            "mybharat_location_id": "MB-LOC-TN-801",
            "mybharat_district": "Chennai",
            "mybharat_state": "Tamil Nadu",
            "mybharat_coordinates": "13.0827° N, 80.2707° E",
            "milestones": [
                {"num": 1, "title": "Coastal Foundation Piling & Cofferdam Construction", "budget": 255.0, "spent": 0.0, "progress": 0.0, "status": "Pending", "notes": "Scheduled to begin upon vendor selection."},
                {"num": 2, "title": "Hydraulic Gate Installation & Marine Wall Armoring", "budget": 340.0, "spent": 0.0, "progress": 0.0, "status": "Pending", "notes": "Gate fabrication in certified foundry."},
                {"num": 3, "title": "Pumping Machinery & SCADA Telemetry Setup", "budget": 170.0, "spent": 0.0, "progress": 0.0, "status": "Pending", "notes": "Automated flood sensor integration."},
                {"num": 4, "title": "High Tide Simulation Trials & Handover", "budget": 85.0, "spent": 0.0, "progress": 0.0, "status": "Pending", "notes": "Public safety audit and civic operational drill."}
            ],
            "proposals": [
                {"vendor": "Tata Projects Ltd", "email": "marine.bids@tataprojects.com", "bid": 820.0, "duration": 22, "exp": 18, "status": "Under Review", "notes": "Includes proprietary Dutch tidal gate design and 5-year comprehensive O&M warranty."},
                {"vendor": "Kirloskar Brothers - NCC Consortium", "email": "epc@kirloskar.com", "bid": 845.0, "duration": 24, "exp": 22, "status": "Submitted", "notes": "High efficiency indigenously manufactured vertical turbine pumps proposed."}
            ],
            "feedbacks": [],
            "concerns": []
        },
        {
            "project_code": "PRJ-SOLAR-405",
            "name": "Rewa Ultra Mega Solar Park 750MW Phase II",
            "department": "Renewable Energy",
            "location": "Rewa (Madhya Pradesh)",
            "contractor": "Mahindra Susten",
            "budget_cr": 1850.0,
            "spent_cr": 1295.0,
            "planned_duration_months": 24,
            "elapsed_months": 18,
            "current_progress_pct": 82.0,
            "start_date": "2024-09-01",
            "target_completion_date": "2026-09-01",
            "remarks": "Grid connectivity substation commissioning ahead of schedule. Minor supply chain bottleneck for solar inverter import resolved.",
            "purpose": "Supply clean solar electricity to Delhi Metro and state distribution companies, offsetting 1.5 million tonnes of carbon emissions annually.",
            "specifications": "Bifacial monocrystalline solar PV modules (540Wp), central inverter stations, 220kV pooling substation, robotic dry-cleaning.",
            "design_doc_url": "https://rewa.solar.gov.in/phase2-specs.pdf",
            "tender_status": "In Execution",
            "bidding_deadline": "2024-06-30",
            "min_vendor_experience_years": 5,
            "tender_category": "Renewable Energy EPC",
            "landslide_risk_pct": 8.2,
            "terrain_type": "Plateau / Dry Scrubland",
            "mybharat_location_id": "MB-LOC-MP-405",
            "mybharat_district": "Rewa",
            "mybharat_state": "Madhya Pradesh",
            "mybharat_coordinates": "24.5332° N, 81.2955° E",
            "milestones": [
                {"num": 1, "title": "Land Topography & Solar Mounting Structure Piling", "budget": 370.0, "spent": 370.0, "progress": 100.0, "status": "Verified by Auditor", "notes": "100% array pile testing certified."},
                {"num": 2, "title": "Solar PV Module Mounting & DC Cabling", "budget": 925.0, "spent": 925.0, "progress": 100.0, "status": "Verified by Auditor", "notes": "1.4 million PV panels installed."},
                {"num": 3, "title": "220kV Grid Interconnection Substation", "budget": 370.0, "spent": 0.0, "progress": 60.0, "status": "In Progress", "notes": "Transmission line tower stringing ongoing."},
                {"num": 4, "title": "Grid Synchronization & Performance Ratio Verification", "budget": 185.0, "spent": 0.0, "progress": 20.0, "status": "In Progress", "notes": "Trial power evacuation successfully initiated."}
            ],
            "proposals": [
                {"vendor": "Mahindra Susten", "email": "tenders@mahindrasusten.com", "bid": 1810.0, "duration": 24, "exp": 14, "status": "Awarded", "notes": "Demonstrated 99.2% plant availability in past solar projects."}
            ],
            "feedbacks": [
                {"citizen": "Dharmendra Singh", "loc": "Gurh Tehsil, Rewa", "q": 5, "sp": 5, "sa": 5, "aspect": "Fund Transparency", "comment": "Local youth from 12 villages received training and employment. Project implementation is very transparent.", "sent": "Positive"}
            ],
            "concerns": []
        },
        {
            "project_code": "PRJ-HEALTH-501",
            "name": "AIIMS Super-Specialty Hospital & Trauma Block",
            "department": "Healthcare",
            "location": "Guwahati (Assam)",
            "contractor": "HSCC India Ltd",
            "budget_cr": 1350.0,
            "spent_cr": 945.0,
            "planned_duration_months": 30,
            "elapsed_months": 22,
            "current_progress_pct": 65.0,
            "start_date": "2024-04-01",
            "target_completion_date": "2026-10-01",
            "remarks": "Medical gas pipeline installation ongoing. Minor delay in specialized MRI machine import clearance, but civil structure 90% completed.",
            "purpose": "Construct a 750-bed state-of-the-art super-specialty tertiary care hospital with 25 modular operation theatres and advanced trauma response units for Northeast India.",
            "specifications": "Seismic Zone V compliant RCC frame, HEPA 14 positive pressure OTs, centralized liquid medical oxygen (LMO) tank, green building GRIHA 4-star.",
            "design_doc_url": "https://aiims.gov.in/guwahati-masterplan.pdf",
            "tender_status": "In Execution",
            "bidding_deadline": "2024-01-30",
            "min_vendor_experience_years": 8,
            "tender_category": "Healthcare & Institutional Buildings",
            "landslide_risk_pct": 68.2,
            "terrain_type": "Hilly / River Basin (Brahmaputra)",
            "mybharat_location_id": "MB-LOC-ASM-501",
            "mybharat_district": "Guwahati (Kamrup Metropolitan)",
            "mybharat_state": "Assam",
            "mybharat_coordinates": "26.1445° N, 91.7362° E",
            "milestones": [
                {"num": 1, "title": "Hospital Block Civil Structure & Basement Retaining", "budget": 540.0, "spent": 540.0, "progress": 100.0, "status": "Verified by Auditor", "notes": "G+8 floors structural shell completed."},
                {"num": 2, "title": "Medical Gas Pipeline (MGPS) & Modular OTs", "budget": 405.0, "spent": 300.0, "progress": 70.0, "status": "In Progress", "notes": "Copper oxygen piping pressure test passed."},
                {"num": 3, "title": "HVAC, Cleanrooms & Electrical Substation", "budget": 270.0, "spent": 105.0, "progress": 35.0, "status": "In Progress", "notes": "Chiller units installed on service floor."},
                {"num": 4, "title": "Biomedical Equipment Integration & NABH Audit", "budget": 135.0, "spent": 0.0, "progress": 10.0, "status": "Pending", "notes": "Scheduled for Q3 2026."}
            ],
            "proposals": [
                {"vendor": "HSCC India Ltd", "email": "contracts@hsccltd.co.in", "bid": 1325.0, "duration": 30, "exp": 35, "status": "Awarded", "notes": "Public sector hospital construction pioneer with impeccable track record."}
            ],
            "feedbacks": [
                {"citizen": "Dr. Ananya Barua", "loc": "Guwahati City", "q": 5, "sp": 4, "sa": 5, "aspect": "Work Quality", "comment": "Construction standards look world class. This facility will be a boon for critical patients across Assam and Meghalaya.", "sent": "Positive"}
            ],
            "concerns": []
        },
        {
            "project_code": "PRJ-TENDER-902",
            "name": "High-Speed EV Freight Corridor & Logistics Park",
            "department": "Highways & Transport",
            "location": "Bengaluru-Chennai Industrial Corridor",
            "contractor": "Open for Competitive Bidding",
            "budget_cr": 1450.0,
            "spent_cr": 0.0,
            "planned_duration_months": 28,
            "elapsed_months": 0,
            "current_progress_pct": 0.0,
            "start_date": "2026-12-01",
            "target_completion_date": "2029-04-01",
            "remarks": "Transparent tender open for joint ventures. Bids being received on e-procurement portal.",
            "purpose": "Establish dedicated electric heavy freight highway with megawatt-class charging hubs and multi-modal container transshipment yard.",
            "specifications": "Heavy-axle 25-tonne pavement design, 480kW CCS-2 DC fast charging points, automated warehousing, solar canopies.",
            "design_doc_url": "https://nhai.gov.in/ev-corridors/blr-che-tender.pdf",
            "tender_status": "Open for Bids",
            "bidding_deadline": "2026-12-15",
            "min_vendor_experience_years": 6,
            "tender_category": "Smart Freight Infrastructure",
            "landslide_risk_pct": 35.4,
            "terrain_type": "Deccan Plateau / Eastern Ghats Transition",
            "mybharat_location_id": "MB-LOC-KA-902",
            "mybharat_district": "Bengaluru Urban",
            "mybharat_state": "Karnataka",
            "mybharat_coordinates": "12.9716° N, 77.5946° E",
            "milestones": [
                {"num": 1, "title": "Land Grading & Logistics Yard Sub-base", "budget": 435.0, "spent": 0.0, "progress": 0.0, "status": "Pending", "notes": "Awaiting tender award."},
                {"num": 2, "title": "Pavement Construction & Dedicated Freight Lanes", "budget": 580.0, "spent": 0.0, "progress": 0.0, "status": "Pending", "notes": "Heavy duty roller compacted concrete."},
                {"num": 3, "title": "Megawatt Charging Hubs & Substation Erection", "budget": 290.0, "spent": 0.0, "progress": 0.0, "status": "Pending", "notes": "Grid tie-in with state transmission grid."},
                {"num": 4, "title": "IoT Logistics Tracking & Final Commissioning", "budget": 145.0, "spent": 0.0, "progress": 0.0, "status": "Pending", "notes": "End-to-end trial runs."}
            ],
            "proposals": [
                {"vendor": "L&T Heavy Infrastructure", "email": "tenders@larsentoubro.com", "bid": 1410.0, "duration": 26, "exp": 30, "status": "Submitted", "notes": "Proprietary heavy-duty concrete mix and rapid mobilization capability."},
                {"vendor": "Shapoorji Pallonji EPC", "email": "infra.bids@shapoorji.com", "bid": 1435.0, "duration": 28, "exp": 25, "status": "Submitted", "notes": "Comprehensive EPC model with solar carport integration."}
            ],
            "feedbacks": [],
            "concerns": []
        },
        {
            "project_code": "PRJ-URBAN-703",
            "name": "Smart City Integrated Traffic Command Center",
            "department": "Urban Development",
            "location": "Bhubaneswar (Odisha)",
            "contractor": "Honeywell Automation",
            "budget_cr": 450.0,
            "spent_cr": 270.0,
            "planned_duration_months": 18,
            "elapsed_months": 12,
            "current_progress_pct": 78.0,
            "start_date": "2025-02-15",
            "target_completion_date": "2026-08-15",
            "remarks": "CCTV camera installation 85% completed. AI traffic signal software integration in final testing phase.",
            "purpose": "Deploy AI-based intelligent traffic signal synchronization, emergency vehicle green corridors, and centralized civic monitoring.",
            "specifications": "4K IP PTZ surveillance cameras, adaptive traffic controllers (ATCS), edge computing video analytics, central video wall.",
            "design_doc_url": "https://smartcitybhubaneswar.gov.in/iccc-techspecs.pdf",
            "tender_status": "In Execution",
            "bidding_deadline": "2024-12-15",
            "min_vendor_experience_years": 5,
            "tender_category": "Smart Cities & Digital Urban Systems",
            "landslide_risk_pct": 5.1,
            "terrain_type": "Urban Plain / Deltaic",
            "mybharat_location_id": "MB-LOC-OD-703",
            "mybharat_district": "Bhubaneswar (Khordha)",
            "mybharat_state": "Odisha",
            "mybharat_coordinates": "20.2961° N, 85.8245° E",
            "milestones": [
                {"num": 1, "title": "Fiber Optic City Network & Sensor Poles", "budget": 135.0, "spent": 135.0, "progress": 100.0, "status": "Verified by Auditor", "notes": "280km optic fiber ring commissioned."},
                {"num": 2, "title": "Command Center Building & Video Wall Installation", "budget": 180.0, "spent": 135.0, "progress": 90.0, "status": "In Progress", "notes": "Main auditorium 120-screen video wall operational."},
                {"num": 3, "title": "AI Traffic Optimization Software Deployment", "budget": 90.0, "spent": 0.0, "progress": 55.0, "status": "In Progress", "notes": "Adaptive signal timing trials on Janpath Corridor."},
                {"num": 4, "title": "Citizen Safety App & Public Rollout", "budget": 45.0, "spent": 0.0, "progress": 20.0, "status": "Pending", "notes": "Beta testing underway."}
            ],
            "proposals": [
                {"vendor": "Honeywell Automation", "email": "smartcities@honeywell.com", "bid": 440.0, "duration": 18, "exp": 20, "status": "Awarded", "notes": "Highest technical score on AI video analytics."}
            ],
            "feedbacks": [
                {"citizen": "Bishnu Mohapatra", "loc": "Saheed Nagar, Bhubaneswar", "q": 4, "sp": 5, "sa": 4, "aspect": "Pace of Work", "comment": "The new traffic signals adapt rapidly to traffic jams during peak hours. Great initiative.", "sent": "Positive"}
            ],
            "concerns": []
        },
        {
            "project_code": "PRJ-WATER-309",
            "name": "Jal Jeevan Mission Rural Water Network",
            "department": "Water Resources",
            "location": "Bundelkhand & Vindhya Region",
            "contractor": "NCC Limited",
            "budget_cr": 2800.0,
            "spent_cr": 1960.0,
            "planned_duration_months": 36,
            "elapsed_months": 26,
            "current_progress_pct": 52.0,
            "start_date": "2024-02-01",
            "target_completion_date": "2027-02-01",
            "remarks": "Pipe procurement delayed due to raw material shortage. Village panchayat permissions pending in 42 locations.",
            "purpose": "Provide functional tap water connections (FHTC) to 620 rural habitations ensuring 55 litres per capita per day potable water supply.",
            "specifications": "Ductile Iron (DI) K9 bulk mains, HDPE distribution pipes, automated chlorination, solar-powered overhead reservoirs.",
            "design_doc_url": "https://jaljeevan.gov.in/bundelkhand-detailed-project-report.pdf",
            "tender_status": "In Execution",
            "bidding_deadline": "2023-10-31",
            "min_vendor_experience_years": 8,
            "tender_category": "Rural Water Supply (EPC)",
            "landslide_risk_pct": 84.5,
            "terrain_type": "Mountainous Vindhya / Rugged Erosion-Prone",
            "mybharat_location_id": "MB-LOC-UP-309",
            "mybharat_district": "Mahoba (Bundelkhand)",
            "mybharat_state": "Uttar Pradesh",
            "mybharat_coordinates": "25.2920° N, 79.8735° E",
            "milestones": [
                {"num": 1, "title": "Intake Well & Water Treatment Plant (WTP) Civil Works", "budget": 840.0, "spent": 840.0, "progress": 100.0, "status": "Verified by Auditor", "notes": "60 MLD treatment plant civil tanks completed."},
                {"num": 2, "title": "Primary Feeder Mains & Booster Pump Stations", "budget": 1120.0, "spent": 800.0, "progress": 55.0, "status": "In Progress", "notes": "Pipe trenching across 140km completed."},
                {"num": 3, "title": "Overhead Storage Tanks (OHT) in Villages", "budget": 560.0, "spent": 320.0, "progress": 40.0, "status": "In Progress", "notes": "38 of 92 overhead tanks erected."},
                {"num": 4, "title": "Household Tap Connections & Metering", "budget": 280.0, "spent": 0.0, "progress": 15.0, "status": "Pending", "notes": "Village panchayat line connections."}
            ],
            "proposals": [
                {"vendor": "NCC Limited", "email": "water.tenders@nccltd.in", "bid": 2750.0, "duration": 36, "exp": 22, "status": "Awarded", "notes": "Proven rural pipeline execution experience in Central India."}
            ],
            "feedbacks": [
                {"citizen": "Rampal Yadav", "loc": "Mahoba District", "q": 3, "sp": 2, "sa": 3, "aspect": "Pace of Work", "comment": "Pipes have been delivered on roadsides for weeks without being laid. Kindly accelerate work before monsoon.", "sent": "Concern"}
            ],
            "concerns": [
                {"name": "Ghanshyam Tiwari", "type": "Prolonged Delay / Inactivity", "title": "Excavated Pipeline Trenches Left Open Near Primary School", "desc": "Trenches dug 3 weeks ago near village primary school pose serious falling hazard to children.", "loc": "Charkhari Village Road, Sector 3", "sev": "Critical", "status": "Action Taken", "resp": "Junior Engineer inspected site; safety barricading installed and backfilling scheduled for immediate completion.", "officer": "Executive Engineer Jal Nigam"}
            ]
        }
    ]

    for data in sample_projects:
        project = Project(
            project_code=data["project_code"],
            name=data["name"],
            department=data["department"],
            location=data["location"],
            contractor=data["contractor"],
            budget_cr=data["budget_cr"],
            spent_cr=data["spent_cr"],
            planned_duration_months=data["planned_duration_months"],
            elapsed_months=data["elapsed_months"],
            current_progress_pct=data["current_progress_pct"],
            start_date=data["start_date"],
            target_completion_date=data["target_completion_date"],
            remarks=data["remarks"],
            purpose=data.get("purpose", ""),
            specifications=data.get("specifications", ""),
            design_doc_url=data.get("design_doc_url", ""),
            tender_status=data.get("tender_status", "In Execution"),
            bidding_deadline=data.get("bidding_deadline", ""),
            min_vendor_experience_years=data.get("min_vendor_experience_years", 5),
            tender_category=data.get("tender_category", "Civil Infrastructure"),
            landslide_risk_pct=data.get("landslide_risk_pct", 0.0),
            terrain_type=data.get("terrain_type", "Plain / Urban"),
            mybharat_location_id=data.get("mybharat_location_id", ""),
            mybharat_district=data.get("mybharat_district", ""),
            mybharat_state=data.get("mybharat_state", ""),
            mybharat_coordinates=data.get("mybharat_coordinates", "")
        )
        db.add(project)
        db.flush()

        # Compute ML Risk Score & Explainability
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

        # NLP Remarks Insights
        nlp_res = risk_res["nlp_insights"]
        remark_insight = RemarkInsight(
            project_id=project.id,
            extracted_keywords=nlp_res["keywords"],
            risk_flags=nlp_res["risk_flags"],
            sentiment_score=nlp_res["sentiment_score"],
            risk_weight_addition=nlp_res["nlp_risk_penalty"]
        )
        db.add(remark_insight)

        # Add Milestones
        for m in data.get("milestones", []):
            ms = ProjectMilestone(
                project_id=project.id,
                milestone_number=m["num"],
                title=m["title"],
                description=f"Phase deliverable for {m['title']}.",
                target_date="",
                allocated_budget_cr=m.get("budget", 0.0),
                spent_budget_cr=m.get("spent", 0.0),
                status=m.get("status", "Pending"),
                progress_pct=m.get("progress", 0.0),
                official_update_notes=m.get("notes", "")
            )
            db.add(ms)

        # Add Proposals
        for p in data.get("proposals", []):
            prop = VendorProposal(
                project_id=project.id,
                vendor_name=p["vendor"],
                vendor_email=p["email"],
                vendor_phone="+91 98765 43210",
                vendor_registration_no=f"GSTIN27AAAC{project.id}99Z5",
                years_of_experience=p.get("exp", 10),
                bid_amount_cr=p["bid"],
                proposed_duration_months=p.get("duration", project.planned_duration_months),
                technical_proposal=f"Comprehensive engineering execution plan utilizing modern machinery and certified workforce.",
                key_personnel="Project Director (20+ yrs exp), Lead Civil Engineer, Safety Auditor",
                financial_capacity_score=92.0 if p.get("status") == "Awarded" else 85.0,
                compliance_certified=True,
                status=p.get("status", "Submitted"),
                decision_notes=p.get("notes", "")
            )
            db.add(prop)

        # Add Citizen Feedbacks
        for f in data.get("feedbacks", []):
            fb = CitizenFeedback(
                project_id=project.id,
                citizen_name=f["citizen"],
                citizen_location=f.get("loc", project.location),
                is_verified_resident=True,
                rating_quality=f.get("q", 4),
                rating_speed=f.get("sp", 4),
                rating_safety=f.get("sa", 4),
                rating_overall=round((f.get("q", 4) + f.get("sp", 4) + f.get("sa", 4)) / 3.0, 1),
                aspect=f.get("aspect", "Work Quality"),
                comment=f["comment"],
                sentiment=f.get("sent", "Positive"),
                upvotes=4
            )
            db.add(fb)

        # Add Citizen Concerns
        for c in data.get("concerns", []):
            cc = CitizenConcern(
                project_id=project.id,
                citizen_name=c["name"],
                citizen_email="citizen.oversight@gov.in",
                concern_type=c["type"],
                title=c["title"],
                description=c["desc"],
                location_detail=c.get("loc", project.location),
                severity=c.get("sev", "Medium"),
                status=c.get("status", "Open"),
                upvotes=12,
                official_response=c.get("resp", "Under investigation by engineering division."),
                response_officer=c.get("officer", "Chief Engineer Oversight"),
                resolved_at=datetime.utcnow() if c.get("status") in ["Resolved", "Action Taken"] else None
            )
            db.add(cc)

        # Alerts
        if risk_res["overall_risk_level"] == "High":
            alert = Alert(
                project_id=project.id,
                title=f"CRITICAL RISK ALERT: {project.project_code}",
                severity="Critical",
                category="Threshold Breach",
                message=f"Overall risk score of {risk_res['overall_risk_score']} exceeds threshold. Predicted delay: {risk_res['predicted_delay_months']} months."
            )
            db.add(alert)
        elif risk_res["overall_risk_level"] == "Medium":
            alert = Alert(
                project_id=project.id,
                title=f"WARNING: Cost/Schedule Slippage on {project.project_code}",
                severity="Warning",
                category="Schedule Delay",
                message=f"Project is experiencing moderate lag. Cost risk score: {risk_res['cost_risk_score']}%, Schedule risk score: {risk_res['schedule_risk_score']}%."
            )
            db.add(alert)

        # Historical Progress
        total_months = max(project.elapsed_months, 6)
        for m in range(1, total_months + 1):
            planned_pct = min(100.0, round((m / project.planned_duration_months) * 100.0, 1))
            factor = (project.current_progress_pct / max(1, planned_pct)) if m == project.elapsed_months else (0.8 + (m / total_months) * 0.2)
            actual_pct = min(100.0, round(planned_pct * factor * (0.85 if risk_res["overall_risk_level"] == "High" else 0.95), 1))
            
            planned_cost = round((planned_pct / 100.0) * project.budget_cr, 1)
            actual_cost = round((actual_pct / 100.0) * project.spent_cr * 1.1, 1) if m == project.elapsed_months else round(planned_cost * 1.05, 1)

            hp = HistoricalProgress(
                project_id=project.id,
                month=m,
                planned_progress_pct=planned_pct,
                actual_progress_pct=actual_pct,
                planned_cost_cr=planned_cost,
                actual_cost_cr=actual_cost
            )
            db.add(hp)

    db.commit()
    print("Database successfully seeded with comprehensive project risk and civic transparency dataset!")
