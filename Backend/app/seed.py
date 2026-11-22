import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app.models.department import GovernmentDepartment
from app.models.service import GovernmentService
from app.models.user import User
from app.models.application import Application
from app.models.document import ApplicationDocument
from app.models.activity import ApplicationActivity
from app.models.notification import Notification
from app.services.auth_service import hash_password

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("goveaseai.seed")

# 1. Government Departments Seed Data
DEPARTMENTS_DATA = [
    {
        "id": "municipal-licensing",
        "name": "Municipal Licensing Division",
        "code": "MLD",
        "category": "Business",
        "description": "Statutory regulation of municipal trades, retail establishments, and local commerce permits.",
        "statutory_act": "Municipal Corporations Act, Sec 443 (Commercial Operations)"
    },
    {
        "id": "department-labour",
        "name": "Department of Labour",
        "code": "DOL",
        "category": "Business",
        "description": "Enforcement of statutory working conditions, shop certifications, and commercial labor welfare.",
        "statutory_act": "Shops and Commercial Establishments Act, Sec 3"
    },
    {
        "id": "directorate-industries",
        "name": "Directorate of Industries",
        "code": "DOI",
        "category": "Business",
        "description": "Licensing, facilitation, and MSME commercial authorization under state industrial development charters.",
        "statutory_act": "State Industrial Enterprises Promotion & Regulatory Act"
    },
    {
        "id": "urban-development",
        "name": "Urban Development & Town Planning",
        "code": "UDTP",
        "category": "Construction",
        "description": "Technical appraisal of structural layouts, master plan zoning compliance, and construction permits.",
        "statutory_act": "Urban Development & Master Plan Town Planning Statutory Code"
    },
    {
        "id": "inspectorate-factories",
        "name": "Inspectorate of Factories",
        "code": "IOF",
        "category": "Industry",
        "description": "Industrial safety appraisal, plant machinery clearance, hazardous process control, and factory licensing.",
        "statutory_act": "Factories Act, Sec 6 (Plan Approval & Registration)"
    },
    {
        "id": "pollution-control",
        "name": "Pollution Control Board",
        "code": "PCB",
        "category": "Environment",
        "description": "Environmental scrutiny, effluent/emission standards assessment, Consent to Operate (CTO) statutory issuance.",
        "statutory_act": "Water & Air (Prevention & Control of Pollution) Acts"
    }
]

# 2. Government Services Seed Data
STANDARD_STEPS = [
    "1. Select Service",
    "2. Provide Application Details",
    "3. Upload Required Documents",
    "4. AI Document Analysis",
    "5. AI Verification",
    "6. Review Application",
    "7. Submit Application",
    "8. Officer Review",
    "9. Digital Approval"
]

SERVICES_DATA = [
    {
        "id": "trade-license",
        "department_id": "municipal-licensing",
        "name": "Trade License",
        "category": "Business",
        "description": "Apply for a trade license for operating a business within the applicable jurisdiction.",
        "short_description": "Apply for a trade license for operating a business within the applicable jurisdiction.",
        "fee": "₹1,500 - ₹5,000 (Based on floor area)",
        "processing_time": "5–7 working days",
        "eligibility": [
            "Business owners/operators who require the applicable trade authorization.",
            "Applicants who meet the configured service conditions.",
            "Premises located within designated municipal commercial zones without tax arrears."
        ],
        "required_documents": [
            {"id": "identity-proof", "name": "Identity Proof", "required": True, "description": "Upload a valid identity document.", "type": "PDF / JPEG"},
            {"id": "address-proof", "name": "Address Proof", "required": True, "description": "Upload a valid proof of physical residence or premises address.", "type": "PDF / JPEG"},
            {"id": "business-reg-proof", "name": "Business/Registration Proof", "required": True, "description": "Upload statutory business incorporation or registration proof.", "type": "PDF"},
            {"id": "business-address-doc", "name": "Business Address Document", "required": True, "description": "Upload registered commercial lease or premise deed.", "type": "PDF"}
        ],
        "application_steps": STANDARD_STEPS,
        "icon_name": "Building",
        "is_active": True
    },
    {
        "id": "shop-registration",
        "department_id": "department-labour",
        "name": "Shop Registration",
        "category": "Business",
        "description": "Register a shop or commercial establishment through the digital application process.",
        "short_description": "Register a shop or commercial establishment through the digital application process.",
        "fee": "₹500 - ₹2,500 (Tiered by employee count)",
        "processing_time": "3–5 working days",
        "eligibility": [
            "Commercial establishment or retail shop operators within designated municipal zones.",
            "Entities employing commercial staff or rendering direct public retail services.",
            "Initiated within 30 days of commencement of commercial business operations."
        ],
        "required_documents": [
            {"id": "identity-proof", "name": "Identity Proof", "required": True, "description": "Valid government photo identification of owner or managing partners.", "type": "PDF / JPEG"},
            {"id": "commercial-lease", "name": "Commercial Lease or Property Tax Receipt", "required": True, "description": "Registered tenancy deed or official property tax statement.", "type": "PDF"},
            {"id": "employee-schedule", "name": "Employee Schedule List", "required": True, "description": "List of staff members, shifts, and statutory wage disclosures.", "type": "PDF / XLSX"},
            {"id": "shop-photo", "name": "Establishment Photo Proof", "required": False, "description": "Frontage photograph with commercial signboard visible.", "type": "JPEG / PNG"}
        ],
        "application_steps": STANDARD_STEPS,
        "icon_name": "Store",
        "is_active": True
    },
    {
        "id": "business-license",
        "department_id": "directorate-industries",
        "name": "Business License",
        "category": "Business",
        "description": "Apply for the required business licensing service.",
        "short_description": "Apply for the required business licensing service.",
        "fee": "₹3,000 flat administrative fee",
        "processing_time": "5–8 working days",
        "eligibility": [
            "Registered enterprise or corporation operating wholesale, logistics, or commercial services.",
            "Compliance with state commercial zoning and Goods and Services Tax (GST) registration.",
            "Designated authorized signatory holding valid digital certification."
        ],
        "required_documents": [
            {"id": "incorporation-cert", "name": "Certificate of Incorporation / Partnership Deed", "required": True, "description": "Charter issued by Ministry of Corporate Affairs or Registrar of Firms.", "type": "PDF"},
            {"id": "gst-cert", "name": "GST Registration Certificate", "required": True, "description": "Valid GSTIN active filing certificate.", "type": "PDF"},
            {"id": "signatory-resolution", "name": "Authorized Signatory Resolution", "required": True, "description": "Board resolution or power of attorney authorization.", "type": "PDF"},
            {"id": "commercial-address", "name": "Commercial Premises Document", "required": True, "description": "Registered commercial address verification document.", "type": "PDF"}
        ],
        "application_steps": STANDARD_STEPS,
        "icon_name": "Briefcase",
        "is_active": True
    },
    {
        "id": "building-permission",
        "department_id": "urban-development",
        "name": "Building Permission",
        "category": "Construction",
        "description": "Submit an application related to building and construction permission.",
        "short_description": "Submit an application related to building and construction permission.",
        "fee": "Calculated per square meter of proposed built-up area",
        "processing_time": "15–21 working days",
        "eligibility": [
            "Titleholder or legally authorized developer of a municipal approved land parcel.",
            "Proposed structural drawings prepared and certified by a licensed municipal architect.",
            "Plot adhering to designated municipal master plan zoning regulations."
        ],
        "required_documents": [
            {"id": "land-title", "name": "Registered Land Title Deed", "required": True, "description": "Deed showing absolute ownership or registered development agreement.", "type": "PDF"},
            {"id": "blueprints", "name": "Architectural Blueprints & Stability Certificate", "required": True, "description": "Stamped dimensional drawings by a licensed structural architect.", "type": "PDF / DWG"},
            {"id": "encumbrance-cert", "name": "Non-Encumbrance Certificate", "required": True, "description": "Sub-registrar certificate covering the preceding 30 years.", "type": "PDF"},
            {"id": "soil-test", "name": "Soil Test & Geotechnical Investigation Report", "required": False, "description": "Certified testing report from an accredited geotechnical laboratory.", "type": "PDF"}
        ],
        "application_steps": STANDARD_STEPS,
        "icon_name": "Hammer",
        "is_active": True
    },
    {
        "id": "factory-registration",
        "department_id": "inspectorate-factories",
        "name": "Factory Registration",
        "category": "Industry",
        "description": "Apply for factory registration and related approvals.",
        "short_description": "Apply for factory registration and related approvals.",
        "fee": "Scaled based on installed horsepower and workforce headcount",
        "processing_time": "14–20 working days",
        "eligibility": [
            "Industrial manufacturing premises employing 10+ workers (with power) or 20+ workers (without power).",
            "Premises located in an approved state industrial development zone.",
            "Machinery installations conforming to statutory safety standards."
        ],
        "required_documents": [
            {"id": "machinery-layout", "name": "Plant Machinery Layout & Flow Diagram", "required": True, "description": "Detailed technical diagram displaying equipment layout and escape routes.", "type": "PDF"},
            {"id": "waste-plan", "name": "Hazardous Material & Waste Plan", "required": True, "description": "Certified disposal agreement with state-approved treatment facility.", "type": "PDF"},
            {"id": "safety-officer", "name": "Factory Safety Officer Appointment", "required": True, "description": "Appointment charter and statutory safety certifications.", "type": "PDF"},
            {"id": "structural-fitness", "name": "Building Structural Fitness Certificate", "required": False, "description": "Competent engineer certificate for industrial machinery load capacity.", "type": "PDF"}
        ],
        "application_steps": STANDARD_STEPS,
        "icon_name": "Factory",
        "is_active": True
    },
    {
        "id": "pollution-certificate",
        "department_id": "pollution-control",
        "name": "Pollution Certificate",
        "category": "Environment",
        "description": "Apply for the applicable pollution/environmental certification service.",
        "short_description": "Apply for the applicable pollution/environmental certification service.",
        "fee": "Tiered by capital investment of the enterprise",
        "processing_time": "10–15 working days",
        "eligibility": [
            "Industrial, healthcare, or commercial installations categorized under Red, Orange, or Green pollution schedules.",
            "Prior Consent to Establish (CTE) granted during development.",
            "Operational effluent treatment or air pollution control systems installed on site."
        ],
        "required_documents": [
            {"id": "cte-report", "name": "Consent to Establish (CTE) Compliance Report", "required": True, "description": "Audit report confirming adherence to initial CTE terms.", "type": "PDF"},
            {"id": "etp-schematics", "name": "Effluent Treatment Plant (ETP/STP) Schematics", "required": True, "description": "Technical schematics and operating parameters of treatment equipment.", "type": "PDF"},
            {"id": "air-test-report", "name": "Ambient Air & Effluent Lab Test Report", "required": True, "description": "Testing report from NABL-accredited environmental laboratory.", "type": "PDF"},
            {"id": "waste-contract", "name": "Solid Waste Disposal Contract", "required": False, "description": "Contract with authorized hazardous waste handling agency.", "type": "PDF"}
        ],
        "application_steps": STANDARD_STEPS,
        "icon_name": "ShieldCheck",
        "is_active": True
    }
]

# 3. Users Seed Data
CITIZEN_PASSWORD_HASH = hash_password("Citizen@123")
OFFICER_PASSWORD_HASH = hash_password("Officer@123")

OFFICER_USERS = [
    # ── Official Government Officers (matching frontend department presets) ──
    {
        "id": "OFF-MLD-001",
        "email": "licensing@goveaseai.gov",
        "full_name": "S. Narayanan",
        "role": "OFFICER",
        "department_id": "municipal-licensing",
        "officer_title": "Senior Licensing Officer",
        "password_hash": hash_password("License@123")
    },
    {
        "id": "OFF-DOL-002",
        "email": "labour@goveaseai.gov",
        "full_name": "P. Ramesh Babu",
        "role": "OFFICER",
        "department_id": "department-labour",
        "officer_title": "Labour Enforcement Officer",
        "password_hash": hash_password("Labour@123")
    },
    {
        "id": "OFF-DOI-003",
        "email": "industry@goveaseai.gov",
        "full_name": "K. Ananya Sharma",
        "role": "OFFICER",
        "department_id": "directorate-industries",
        "officer_title": "Industries Promotion Officer",
        "password_hash": hash_password("Industry@123")
    },
    {
        "id": "OFF-UDTP-004",
        "email": "building@goveaseai.gov",
        "full_name": "M. Venkat Reddy",
        "role": "OFFICER",
        "department_id": "urban-development",
        "officer_title": "Town Planning Officer",
        "password_hash": hash_password("Building@123")
    },
    {
        "id": "OFF-IOF-005",
        "email": "factory@goveaseai.gov",
        "full_name": "G. Harish Chandra",
        "role": "OFFICER",
        "department_id": "inspectorate-factories",
        "officer_title": "Factory Licensing Officer",
        "password_hash": hash_password("Factory@123")
    },
    {
        "id": "OFF-PCB-006",
        "email": "pollution@goveaseai.gov",
        "full_name": "Dr. S. Radhika",
        "role": "OFFICER",
        "department_id": "pollution-control",
        "officer_title": "Pollution Control Officer",
        "password_hash": hash_password("Pollution@123")
    },
    # ── Alternative Officer Email Aliases ──
    {
        "id": "OFF-MLD-4091",
        "email": "trade.officer@govease.ai",
        "full_name": "S. Narayanan",
        "role": "OFFICER",
        "department_id": "municipal-licensing",
        "officer_title": "Municipal Licensing Officer",
        "password_hash": hash_password("Officer@123")
    },
    {
        "id": "OFF-DOL-2018",
        "email": "labour.officer@govease.ai",
        "full_name": "P. Ramesh Babu",
        "role": "OFFICER",
        "department_id": "department-labour",
        "officer_title": "Labour Enforcement Officer",
        "password_hash": hash_password("Officer@123")
    },
    {
        "id": "OFF-DOI-3105",
        "email": "industries.officer@govease.ai",
        "full_name": "K. Ananya Sharma",
        "role": "OFFICER",
        "department_id": "directorate-industries",
        "officer_title": "Industries Promotion Officer",
        "password_hash": hash_password("Officer@123")
    },
    {
        "id": "OFF-UDTP-1102",
        "email": "planning.officer@govease.ai",
        "full_name": "M. Venkat Reddy",
        "role": "OFFICER",
        "department_id": "urban-development",
        "officer_title": "Town Planning Officer",
        "password_hash": hash_password("Officer@123")
    },
    {
        "id": "OFF-IOF-5204",
        "email": "factory.officer@govease.ai",
        "full_name": "G. Harish Chandra",
        "role": "OFFICER",
        "department_id": "inspectorate-factories",
        "officer_title": "Factory Licensing Officer",
        "password_hash": hash_password("Officer@123")
    },
    {
        "id": "OFF-PCB-6309",
        "email": "pollution.officer@govease.ai",
        "full_name": "Dr. S. Radhika",
        "role": "OFFICER",
        "department_id": "pollution-control",
        "officer_title": "Pollution Control Officer",
        "password_hash": hash_password("Officer@123")
    }
]

CITIZEN_USERS = [
    {"id": "demo-citizen-001", "email": "citizen@govease.ai", "full_name": "Ravi Kumar", "password_hash": hash_password("Citizen@123")},
    {"id": "demo-citizen-000", "email": "naga@gmail.com", "full_name": "Naga Chaithanya", "password_hash": hash_password("Password@123")},
    {"id": "demo-citizen-002", "email": "ramesh.kumar@example.com", "full_name": "Ramesh Kumar"},
    {"id": "demo-citizen-003", "email": "farooq.auto@example.com", "full_name": "Mohammed Farooq"},
    {"id": "demo-citizen-004", "email": "vikram.rao@example.com", "full_name": "K. Vikramaditya Rao"},
    {"id": "demo-citizen-005", "email": "nageshwar.rao@example.com", "full_name": "B. Nageshwar Rao"},
    {"id": "demo-citizen-006", "email": "srinivas.raju@example.com", "full_name": "G. Srinivas Raju"},
    {"id": "demo-citizen-007", "email": "sharma.alloys@example.com", "full_name": "A. K. Sharma"},
    {"id": "demo-citizen-008", "email": "rajeshwar.pkg@example.com", "full_name": "V. Rajeshwar"},
    {"id": "demo-citizen-010", "email": "sneha.reddy@example.com", "full_name": "Sneha Reddy"},
    {"id": "demo-citizen-011", "email": "murthy.retail@example.com", "full_name": "K. S. Murthy"},
    {"id": "demo-citizen-012", "email": "balakrishna@example.com", "full_name": "K. Balakrishna"},
    {"id": "demo-citizen-018", "email": "anand.kumar@example.com", "full_name": "P. Anand Kumar"},
    {"id": "demo-citizen-019", "email": "naresh.electro@example.com", "full_name": "V. Naresh"},
    {"id": "demo-citizen-020", "email": "srinivasulu@example.com", "full_name": "T. Srinivasulu"},
    {"id": "demo-citizen-021", "email": "agarwal.chem@example.com", "full_name": "R. K. Agarwal"}
]

# 4. Applications Seed Data
APPLICATIONS_DATA = [
    # 1. Municipal Licensing Division — Trade License
    {
        "id": "GEAI-2026-000001",
        "citizen_id": "demo-citizen-001",
        "service_id": "trade-license",
        "department_id": "municipal-licensing",
        "status": "OFFICER_REVIEW",
        "current_step": 8,
        "risk_level": "MEDIUM",
        "ai_verification_summary": "Aadhaar identity verified. Minor address spelling variance between rental deed and application form.",
        "form_data": {
            "applicantName": "Ravi Kumar",
            "fatherSpouseName": "K. Sundaram",
            "applicantDob": "1988-06-15",
            "applicantGender": "Male",
            "applicantAadhaar": "XXXX-XXXX-4091",
            "applicantPan": "ABCDE1234F",
            "contactMobile": "+91 98765 43210",
            "contactEmail": "ravi.kumar@example.com",
            "residentialAddress": "Flat 42B, Road 10, Jubilee Hills, Hyderabad 500033",
            "businessName": "Sri Sai Enterprises",
            "tradeType": "Retail & General Trading",
            "tradeCategory": "Commercial Retail / Fast Moving Consumer Goods",
            "floorAreaSqFt": "650",
            "powerLoadHp": "5 HP",
            "operatingHours": "08:00 AM - 10:00 PM",
            "commencementDate": "2024-02-01",
            "premisesOwnership": "Rented / Leased",
            "premisesAddress": "Plot 42, Hitech City Main Road, Madhapur, Hyderabad 500081",
            "taxAssessmentNo": "GHMC-2026-TX-9011"
        },
        "field_metadata": {
            "businessName": {"source": "MANUAL"},
            "tradeType": {"source": "MANUAL"},
            "applicantName": {"source": "MANUAL"},
            "premisesAddress": {"source": "MANUAL"}
        },
        "documents": [
            {"id": "doc-1", "document_type": "Applicant Aadhaar Card", "file_name": "aadhaar_ravi_kumar.pdf", "file_size": 524288, "mime_type": "application/pdf", "status": "VERIFIED"},
            {"id": "doc-2", "document_type": "Registered Tenancy Deed", "file_name": "commercial_lease_plot42.pdf", "file_size": 1048576, "mime_type": "application/pdf", "status": "VERIFIED"},
            {"id": "doc-3", "document_type": "Property Tax Receipt", "file_name": "ghmc_tax_2026.pdf", "file_size": 419430, "mime_type": "application/pdf", "status": "VERIFIED"}
        ]
    },
    {
        "id": "GEAI-2026-000007",
        "citizen_id": "demo-citizen-002",
        "service_id": "trade-license",
        "department_id": "municipal-licensing",
        "status": "APPROVED",
        "current_step": 9,
        "risk_level": "LOW",
        "ai_verification_summary": "All 4 statutory credentials verified with 99% confidence. Clear zoning compliance.",
        "approval_reference": "GEAI/MLD/TL/2026/00912",
        "approval_date": "2026-09-11",
        "officer_decided_by": "S. Narayanan",
        "officer_remarks": "Verified and approved.",
        "form_data": {
            "applicantName": "Ramesh Kumar",
            "applicantMobile": "+91 98490 12345",
            "businessName": "Deccan Supermarket",
            "tradeCategory": "Supermarket & Packaged Goods",
            "floorAreaSqFt": "1,200",
            "premisesAddress": "Shop 104, Asian Mall Road, Kukatpally, Hyderabad"
        },
        "field_metadata": {"applicantName": {"source": "MANUAL"}},
        "documents": []
    },
    # 2. Department of Labour — Shop Registration
    {
        "id": "GEAI-2026-000002",
        "citizen_id": "demo-citizen-001",
        "service_id": "shop-registration",
        "department_id": "department-labour",
        "status": "CORRECTION_REQUIRED",
        "current_step": 6,
        "risk_level": "MEDIUM",
        "ai_verification_summary": "Electricity bill uploaded was blurry. Commercial lease property tax number unverified.",
        "remarks": "Please upload a high-resolution copy of the commercial establishment Electricity Bill or Property Tax Receipt matching the business address.",
        "officer_remarks": "Please upload a high-resolution copy of the commercial establishment Electricity Bill or Property Tax Receipt matching the business address.",
        "officer_decided_by": "P. Ramesh Babu",
        "form_data": {
            "applicantName": "Ravi Kumar",
            "employerName": "Ravi Kumar",
            "businessName": "Kumar Provision Store",
            "establishmentCategory": "Retail Grocery Store",
            "employeeCount": "4",
            "workingShifts": "Single Shift (09:00 AM to 08:00 PM)",
            "weeklyHoliday": "Tuesday",
            "premisesAddress": "Shop 12, Commercial Complex, KPHB Colony, Hyderabad 500072"
        },
        "field_metadata": {"businessName": {"source": "MANUAL"}, "applicantName": {"source": "MANUAL"}},
        "documents": []
    },
    {
        "id": "GEAI-2026-000008",
        "citizen_id": "demo-citizen-003",
        "service_id": "shop-registration",
        "department_id": "department-labour",
        "status": "OFFICER_REVIEW",
        "current_step": 8,
        "risk_level": "LOW",
        "ai_verification_summary": "Identity and commercial tax records validated. Employee shift schedule conforms to statutory norms.",
        "form_data": {
            "applicantName": "Mohammed Farooq",
            "employerName": "Mohammed Farooq",
            "businessName": "Farooq Auto Spares & Accessories",
            "establishmentCategory": "Automobile Retail",
            "employeeCount": "6",
            "premisesAddress": "Plot 15, Auto Nagar, Gachibowli, Hyderabad"
        },
        "field_metadata": {"applicantName": {"source": "MANUAL"}},
        "documents": []
    },
    # 3. Directorate of Industries — Business License
    {
        "id": "GEAI-2026-000003",
        "citizen_id": "demo-citizen-001",
        "service_id": "business-license",
        "department_id": "directorate-industries",
        "status": "APPROVED",
        "current_step": 9,
        "risk_level": "LOW",
        "ai_verification_summary": "Ministry of Corporate Affairs CIN, active GSTIN, and board resolution confirmed.",
        "approval_reference": "GEAI/DOI/BL/2026/89412",
        "approval_date": "2026-09-11",
        "officer_decided_by": "K. Ananya Sharma",
        "form_data": {
            "applicantName": "Ravi Kumar",
            "authorizedSignatory": "Ravi Kumar (Director)",
            "businessName": "Apex Cloud Solutions Pvt Ltd",
            "registrationType": "Private Limited / MSME Medium Enterprise",
            "gstin": "36AAACA1234B1Z5",
            "cin": "U72200TG2022PTC123456",
            "premisesAddress": "Unit 301, Cyber Towers, Hitec City, Hyderabad 500081"
        },
        "field_metadata": {"businessName": {"source": "MANUAL"}, "applicantName": {"source": "MANUAL"}},
        "documents": []
    },
    {
        "id": "GEAI-2026-000009",
        "citizen_id": "demo-citizen-004",
        "service_id": "business-license",
        "department_id": "directorate-industries",
        "status": "OFFICER_REVIEW",
        "current_step": 8,
        "risk_level": "LOW",
        "ai_verification_summary": "Valid corporate incorporation, active GST status, and board resolution charter verified.",
        "form_data": {
            "applicantName": "K. Vikramaditya Rao",
            "authorizedSignatory": "K. Vikramaditya Rao (Managing Partner)",
            "businessName": "Telangana Logistics Hub LLP",
            "registrationType": "Limited Liability Partnership",
            "gstin": "36BBBBB5678C1Z9",
            "premisesAddress": "Survey 22/A, Shamshabad Cargo Area, Hyderabad"
        },
        "field_metadata": {"applicantName": {"source": "MANUAL"}},
        "documents": []
    },
    # 4. Urban Development & Town Planning — Building Permission
    {
        "id": "GEAI-2026-000004",
        "citizen_id": "demo-citizen-001",
        "service_id": "building-permission",
        "department_id": "urban-development",
        "status": "OFFICER_REVIEW",
        "current_step": 8,
        "risk_level": "MEDIUM",
        "ai_verification_summary": "Architectural blueprint parsed. Structural stability report verified. Discretionary setback check advised.",
        "form_data": {
            "applicantName": "Ravi Kumar",
            "plotNumber": "Plot 108, Sy No 44",
            "layoutApprovalNo": "HMDA-LP-2021-988",
            "constructionType": "Commercial Complex (G+2)",
            "proposedBuiltUpArea": "3,800 sq ft",
            "architectLicenseNo": "CA/2018/49102",
            "siteAddress": "Road No. 36, Jubilee Hills, Hyderabad 500033"
        },
        "field_metadata": {"applicantName": {"source": "MANUAL"}},
        "documents": []
    },
    {
        "id": "GEAI-2026-000010",
        "citizen_id": "demo-citizen-005",
        "service_id": "building-permission",
        "department_id": "urban-development",
        "status": "REJECTED",
        "current_step": 9,
        "risk_level": "HIGH",
        "ai_verification_summary": "Non-encumbrance certificate indicates ongoing civil court injunction over parcel boundary.",
        "remarks": "Application rejected due to active title encumbrance and property boundary dispute registered under Sub-Registrar records.",
        "officer_remarks": "Application rejected due to active title encumbrance and property boundary dispute registered under Sub-Registrar records.",
        "officer_decided_by": "M. Venkat Reddy",
        "form_data": {
            "applicantName": "B. Nageshwar Rao",
            "plotNumber": "Plot 4, Survey 78",
            "constructionType": "Residential Apartment (Stilt + 5)",
            "siteAddress": "Near Metro Pillar 114, Miyapur, Hyderabad"
        },
        "field_metadata": {"applicantName": {"source": "MANUAL"}},
        "documents": []
    },
    # 5. Inspectorate of Factories — Factory Registration
    {
        "id": "GEAI-2026-000005",
        "citizen_id": "demo-citizen-006",
        "service_id": "factory-registration",
        "department_id": "inspectorate-factories",
        "status": "OFFICER_REVIEW",
        "current_step": 8,
        "risk_level": "LOW",
        "ai_verification_summary": "Plant layout diagram verified against statutory safety rules. 45 HP machinery load matched.",
        "form_data": {
            "applicantName": "G. Srinivas Raju",
            "occupierName": "G. Srinivas Raju",
            "factoryManager": "P. V. Subba Rao",
            "factoryName": "Deccan Polymer Molding Works",
            "manufacturingActivity": "Injection Molding & Industrial Plastic Components",
            "installedHorsepower": "45 HP",
            "totalWorkers": "24",
            "safetyOfficerAppointed": "Yes (Cert #SO-2023-88)",
            "factoryPremises": "Shed 8, Industrial Development Area, Jeedimetla, Hyderabad 500055"
        },
        "field_metadata": {"applicantName": {"source": "MANUAL"}},
        "documents": []
    },
    # 6. Pollution Control Board — Pollution Certificate
    {
        "id": "GEAI-2026-000006",
        "citizen_id": "demo-citizen-008",
        "service_id": "pollution-certificate",
        "department_id": "pollution-control",
        "status": "APPROVED",
        "current_step": 9,
        "risk_level": "LOW",
        "approval_reference": "GEAI/PCB/CTO/2026/00451",
        "approval_date": "2026-09-10",
        "officer_decided_by": "Dr. S. Radhika",
        "form_data": {
            "applicantName": "V. Rajeshwar",
            "industryName": "EcoKraft Packaging Pvt Ltd",
            "pollutionCategory": "Green Category (Eco-friendly Cardboard Packing)",
            "premisesAddress": "Plot 77, IDA Pashamylaram, Sangareddy District"
        },
        "field_metadata": {"applicantName": {"source": "MANUAL"}},
        "documents": []
    },
    # Additional citizen drafts & applications for complete demonstration
    {
        "id": "GEAI-2026-000013",
        "citizen_id": "demo-citizen-001",
        "service_id": "factory-registration",
        "department_id": "inspectorate-factories",
        "status": "DRAFT",
        "current_step": 2,
        "risk_level": "LOW",
        "form_data": {
            "applicantName": "Ravi Kumar",
            "occupierName": "Ravi Kumar",
            "factoryName": "Sai Precision Engineering Works",
            "manufacturingActivity": "CNC Precision Components",
            "installedHorsepower": "25 HP",
            "totalWorkers": "12"
        },
        "field_metadata": {},
        "documents": []
    },
    {
        "id": "GEAI-2026-000014",
        "citizen_id": "demo-citizen-001",
        "service_id": "pollution-certificate",
        "department_id": "pollution-control",
        "status": "SUBMITTED",
        "current_step": 3,
        "risk_level": "LOW",
        "form_data": {
            "applicantName": "Ravi Kumar",
            "industryName": "Sai Precision Engineering Works",
            "pollutionCategory": "Green Category (Non-polluting Fabrication)",
            "premisesAddress": "Plot 88, IDA Cherlapally, Hyderabad"
        },
        "field_metadata": {},
        "documents": []
    },
    {
        "id": "GEAI-2026-000015",
        "citizen_id": "demo-citizen-001",
        "service_id": "trade-license",
        "department_id": "municipal-licensing",
        "status": "AI_PROCESSING",
        "current_step": 4,
        "risk_level": "LOW",
        "form_data": {
            "applicantName": "Ravi Kumar",
            "businessName": "Sri Sai Enterprises - Branch 2",
            "tradeCategory": "Commercial Retail / Fast Moving Consumer Goods",
            "floorAreaSqFt": "450",
            "premisesAddress": "Shop 18, Commercial Arcade, Kondapur, Hyderabad 500084"
        },
        "field_metadata": {},
        "documents": []
    },
    {
        "id": "GEAI-2026-000016",
        "citizen_id": "demo-citizen-001",
        "service_id": "building-permission",
        "department_id": "urban-development",
        "status": "REJECTED",
        "current_step": 9,
        "risk_level": "HIGH",
        "ai_verification_summary": "GIS spatial overlay indicated parcel overlap with environmental buffer zone.",
        "remarks": "Application rejected as the proposed commercial construction falls within the statutory 30m lake conservation buffer area.",
        "officer_remarks": "Application rejected as the proposed commercial construction falls within the statutory 30m lake conservation buffer area.",
        "form_data": {
            "applicantName": "Ravi Kumar",
            "plotNumber": "Plot 12, Survey 89",
            "constructionType": "Commercial Storage Shed",
            "siteAddress": "Near Durgam Cheruvu Buffer Zone, Madhapur, Hyderabad"
        },
        "field_metadata": {},
        "documents": []
    }
]

# 5. Initial Notifications Seed Data
NOTIFICATIONS_DATA = [
    {
        "id": "notif-001",
        "user_id": "demo-citizen-001",
        "title": "Trade License under Officer Review",
        "description": "Your application GEAI-2026-000001 has passed AI pre-validation and is currently under desk scrutiny by Municipal Administration.",
        "type": "info",
        "read": False,
        "related_application_id": "GEAI-2026-000001",
        "action_url": "/applications/GEAI-2026-000001"
    },
    {
        "id": "notif-002",
        "user_id": "demo-citizen-001",
        "title": "Correction Required: Shop Registration",
        "description": "Officer requested correction for GEAI-2026-000002. Remarks: Please provide a valid address document matching commercial premises.",
        "type": "warning",
        "read": False,
        "related_application_id": "GEAI-2026-000002",
        "action_url": "/applications/GEAI-2026-000002"
    },
    {
        "id": "notif-003",
        "user_id": "demo-citizen-001",
        "title": "Application Approved: Business License",
        "description": "Congratulations! Your Business License GEAI-2026-000003 has been sanctioned. Prototype digital approval is ready for view.",
        "type": "success",
        "read": True,
        "related_application_id": "GEAI-2026-000003",
        "action_url": "/applications/GEAI-2026-000003/approval"
    },
    {
        "id": "notif-004",
        "user_id": "demo-citizen-001",
        "title": "Citizen Profile Active",
        "description": "Welcome to GovEaseAI! Your prototype citizen profile is ready to discover and apply for 6 digitized government services.",
        "type": "info",
        "read": True,
        "action_url": "/services"
    }
]

def seed_database():
    """Idempotently seed the GovEaseAI PostgreSQL database."""
    db: Session = SessionLocal()
    try:
        logger.info("Starting GovEaseAI database seeding...")

        # 1. Departments
        for d in DEPARTMENTS_DATA:
            existing = db.query(GovernmentDepartment).filter(GovernmentDepartment.id == d["id"]).first()
            if not existing:
                dept = GovernmentDepartment(**d)
                db.add(dept)
            else:
                for k, v in d.items():
                    setattr(existing, k, v)
        db.commit()
        logger.info(f"Seeded {len(DEPARTMENTS_DATA)} government departments.")

        # 2. Services
        for s in SERVICES_DATA:
            existing = db.query(GovernmentService).filter(GovernmentService.id == s["id"]).first()
            if not existing:
                service = GovernmentService(**s)
                db.add(service)
            else:
                for k, v in s.items():
                    setattr(existing, k, v)
        db.commit()
        logger.info(f"Seeded {len(SERVICES_DATA)} government services.")

        # 3. Officers
        for off in OFFICER_USERS:
            existing = db.query(User).filter(
                (User.id == off["id"]) | (User.email.ilike(off["email"]))
            ).first()
            pass_hash = off.get("password_hash") or OFFICER_PASSWORD_HASH
            if not existing:
                user = User(
                    id=off["id"],
                    email=off["email"],
                    password_hash=pass_hash,
                    full_name=off["full_name"],
                    role=off["role"],
                    department_id=off["department_id"],
                    officer_title=off["officer_title"]
                )
                db.add(user)
            else:
                existing.email = off["email"]
                existing.full_name = off["full_name"]
                existing.role = off["role"]
                existing.department_id = off["department_id"]
                existing.officer_title = off["officer_title"]
                existing.password_hash = pass_hash
        db.commit()
        logger.info(f"Seeded {len(OFFICER_USERS)} authorized officer accounts.")

        # 4. Citizens
        for cit in CITIZEN_USERS:
            existing = db.query(User).filter(
                (User.id == cit["id"]) | (User.email.ilike(cit["email"]))
            ).first()
            pass_hash = cit.get("password_hash") or CITIZEN_PASSWORD_HASH
            if not existing:
                user = User(
                    id=cit["id"],
                    email=cit["email"],
                    password_hash=pass_hash,
                    full_name=cit["full_name"],
                    role="CITIZEN"
                )
                db.add(user)
            else:
                existing.email = cit["email"]
                existing.full_name = cit["full_name"]
                existing.role = "CITIZEN"
                existing.password_hash = pass_hash
        db.commit()
        logger.info(f"Seeded {len(CITIZEN_USERS)} citizen accounts.")

        # 5. Applications & Documents
        for app_data in APPLICATIONS_DATA:
            existing = db.query(Application).filter(Application.id == app_data["id"]).first()
            docs_data = app_data.get("documents", [])
            
            app_fields = {
                "id": app_data["id"],
                "application_number": app_data["id"],
                "citizen_id": app_data["citizen_id"],
                "service_id": app_data["service_id"],
                "department_id": app_data["department_id"],
                "status": app_data.get("status", "DRAFT"),
                "current_step": app_data.get("current_step", 1),
                "risk_level": app_data.get("risk_level", "LOW"),
                "ai_verification_summary": app_data.get("ai_verification_summary"),
                "remarks": app_data.get("remarks"),
                "officer_remarks": app_data.get("officer_remarks"),
                "officer_decided_by": app_data.get("officer_decided_by"),
                "approval_reference": app_data.get("approval_reference"),
                "approval_date": app_data.get("approval_date"),
                "form_data": app_data.get("form_data", {}),
                "field_metadata": app_data.get("field_metadata", {})
            }

            if not existing:
                app_obj = Application(**app_fields)
                db.add(app_obj)
            else:
                for k, v in app_fields.items():
                    setattr(existing, k, v)

            db.commit()

            # Seed Documents
            for doc in docs_data:
                existing_doc = db.query(ApplicationDocument).filter(
                    ApplicationDocument.application_id == app_data["id"],
                    ApplicationDocument.id == doc["id"]
                ).first()
                if not existing_doc:
                    new_doc = ApplicationDocument(
                        id=doc["id"],
                        application_id=app_data["id"],
                        document_type=doc["document_type"],
                        file_name=doc["file_name"],
                        file_size=doc.get("file_size", 102400),
                        mime_type=doc.get("mime_type", "application/pdf"),
                        status=doc.get("status", "VERIFIED")
                    )
                    db.add(new_doc)
            db.commit()

        logger.info(f"Seeded {len(APPLICATIONS_DATA)} applications.")

        # 6. Notifications
        for n in NOTIFICATIONS_DATA:
            existing = db.query(Notification).filter(Notification.id == n["id"]).first()
            if not existing:
                notif = Notification(**n)
                db.add(notif)
            else:
                for k, v in n.items():
                    setattr(existing, k, v)
        db.commit()
        logger.info(f"Seeded {len(NOTIFICATIONS_DATA)} notifications.")

        # 7. Initial Officer Activities
        for app_data in APPLICATIONS_DATA:
            app_id = app_data["id"]
            act_id = f"act-{app_id}-init"
            existing_act = db.query(ApplicationActivity).filter(ApplicationActivity.id == act_id).first()
            if not existing_act:
                act = ApplicationActivity(
                    id=act_id,
                    application_id=app_id,
                    department_id=app_data["department_id"],
                    actor_name=app_data.get("officer_decided_by", "GovEaseAI Officer"),
                    action_type="MOVED_TO_REVIEW" if app_data["status"] == "OFFICER_REVIEW" else ("APPLICATION_APPROVED" if app_data["status"] == "APPROVED" else "APPLICATION_SUBMITTED"),
                    description=f"Application {app_id} entered {app_data['status']} state in registry."
                )
                db.add(act)
        db.commit()
        logger.info("Seeded initial application activities.")

        logger.info("GovEaseAI PostgreSQL database seeding successfully completed!")
    except Exception as e:
        db.rollback()
        logger.exception(f"Database seeding failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
