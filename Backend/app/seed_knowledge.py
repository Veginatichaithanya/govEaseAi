"""
Seeds realistic, official Indian Government Knowledge Base records into PostgreSQL.
Covers:
1. Trade License (Municipal Licensing Division)
2. Shop Registration (Department of Labour)
3. Business License (Directorate of Industries)
4. Building Permission (Urban Development & Town Planning)
5. Factory Registration (Inspectorate of Factories)
6. Pollution Certificate (Pollution Control Board)
7. General Government Platform Knowledge
"""
import uuid
from app.database import SessionLocal
from app.models.knowledge import (
    ServiceKnowledgeDocument,
    ServiceDocumentRequirement,
    ServiceApplicationStep,
)

KNOWLEDGE_DOCUMENTS = [
    # ── Trade License ──────────────────────────────────────────────────────────
    {
        "service_id": "trade-license",
        "title": "Trade License Overview & Legal Mandate",
        "category": "eligibility",
        "source_name": "National Government Services Portal / Municipal Corporation Act",
        "source_url": "https://services.india.gov.in/service/detail/apply-for-trade-license",
        "document_type": "ACT",
        "content": (
            "Under Section 353 of the Municipal Corporation Act, a Trade License is a mandatory statutory "
            "authorization granted to carry out a specific trade, business, or commercial activity within "
            "the municipal jurisdiction. It ensures that the business does not cause health hazards, nuisance, "
            "or structural non-compliance. Any individual, proprietorship, partnership firm, LLP, or private limited "
            "company operating a commercial premises must obtain a valid Trade License prior to commencement."
        ),
    },
    {
        "service_id": "trade-license",
        "title": "Required Documents for Trade License Application",
        "category": "documents",
        "source_name": "Municipal Licensing Division Guidelines",
        "source_url": "https://services.india.gov.in",
        "document_type": "GUIDELINE",
        "content": (
            "To apply for a Municipal Trade License, the applicant must submit: "
            "1. Identity Proof: Aadhaar Card or PAN Card of the applicant/proprietor. "
            "2. Address & Premises Proof: Latest Property Tax receipt (if owned) OR registered Rental Agreement / Lease Deed with Owner's NOC (if rented). "
            "3. Business Proof: Certificate of Incorporation, Partnership Deed, or GST Registration Certificate. "
            "4. Fire Safety NOC: Required if commercial area exceeds 500 sq.ft or involves restaurants, inflammable goods, or high footfall. "
            "5. Commercial Floor Layout Plan: Architect-certified sketch showing total floor carpet area and emergency exit."
        ),
    },
    {
        "service_id": "trade-license",
        "title": "Trade License Fees, Processing Timeline & Validity",
        "category": "fees",
        "source_name": "Municipal Corporation Fee Schedule (SRO-2024)",
        "source_url": "https://services.india.gov.in",
        "document_type": "CIRCULAR",
        "content": (
            "Standard statutory fee for General Commercial Trade License ranges from ₹2,500 to ₹5,000 annually based on commercial square footage. "
            "Processing timeline is typically 7 to 15 working days following document verification. "
            "Validity: Valid for one financial year (April 1 to March 31). Annual renewal must be initiated between March 1 and April 30 to avoid penalty surcharges."
        ),
    },
    {
        "service_id": "trade-license",
        "title": "Trade License Inspection & Approval Workflow",
        "category": "steps",
        "source_name": "Municipal Ease of Doing Business Procedures",
        "source_url": "https://services.india.gov.in",
        "document_type": "REGULATION",
        "content": (
            "Workflow: 1. Submission of application form with business details. "
            "2. Document upload and automated AI verification. "
            "3. Preliminary verification report generated. "
            "4. Municipal Licensing Officer conducts desk scrutiny and/or physical site verification. "
            "5. Officer approval and digital issuance of signed certificate with QR code verification."
        ),
    },

    # ── Shop Registration ──────────────────────────────────────────────────────
    {
        "service_id": "shop-registration",
        "title": "Shop & Establishment Act Registration Requirements",
        "category": "eligibility",
        "source_name": "State Labour Department / Shops and Commercial Establishments Act",
        "source_url": "https://labour.gov.in",
        "document_type": "ACT",
        "content": (
            "Under the Shops and Commercial Establishments Act, every commercial establishment, retail shop, "
            "e-commerce warehouse, office, and restaurant must register with the Chief Inspector of Shops "
            "within 30 days of commencement of operations. It regulates working hours, statutory leaves, overtime wages, "
            "safety standards, and employee rights."
        ),
    },
    {
        "service_id": "shop-registration",
        "title": "Required Documents for Shop Registration",
        "category": "documents",
        "source_name": "Department of Labour Citizen Charter",
        "source_url": "https://labour.gov.in",
        "document_type": "GUIDELINE",
        "content": (
            "Documents required for Shop & Commercial Establishment Registration: "
            "1. Identity Proof of Employer: Aadhaar Card or Voter ID. "
            "2. Proof of Establishment Address: Electricity Bill, Gas Connection Bill, or Property Tax receipt. "
            "3. Rental / Lease Agreement: Valid registered lease deed along with Landlord NOC if operating from rented premises. "
            "4. Establishment Photo: Clear exterior photograph of the shop entrance displaying name board in English and official local state language. "
            "5. List of Employees / Form A: Schedule detailing names, designations, date of joining, and wage structure of all current employees."
        ),
    },
    {
        "service_id": "shop-registration",
        "title": "Shop Registration Fees & Renewal Guidelines",
        "category": "fees",
        "source_name": "Department of Labour Statutory Rules",
        "source_url": "https://labour.gov.in",
        "document_type": "REGULATION",
        "content": (
            "Registration fee is graded based on the number of employed workers: "
            "Zero employees: ₹500; 1 to 9 employees: ₹1,500; 10+ employees: ₹3,500. "
            "Processing time: 5 to 10 working days. "
            "Validity: Valid for 5 years in participating states under Ease of Doing Business reform. Renewal must be filed 30 days before expiration."
        ),
    },

    # ── Business License ───────────────────────────────────────────────────────
    {
        "service_id": "business-license",
        "title": "Business License & Industrial Enterprise Accreditation",
        "category": "eligibility",
        "source_name": "Directorate of Industries & Commerce / MSME Development Act",
        "source_url": "https://msme.gov.in",
        "document_type": "ACT",
        "content": (
            "The Business License issued by the Directorate of Industries accredits commercial, trading, and "
            "industrial enterprises. Governed under the Industries (Development and Regulation) Act and MSME "
            "Development Act 2006, it enables enterprises to participate in state subsidies, industrial power tariffs, "
            "public procurement exemptions, and single-window industrial clearances."
        ),
    },
    {
        "service_id": "business-license",
        "title": "Required Documents for Business License",
        "category": "documents",
        "source_name": "Directorate of Industries Single Window System",
        "source_url": "https://nsws.gov.in",
        "document_type": "GUIDELINE",
        "content": (
            "Required documentation: "
            "1. Applicant Identity Proof: Aadhaar Card and PAN Card of Authorized Signatory. "
            "2. Business Entity Proof: Certificate of Incorporation (MCA), Partnership Deed, or Trust Deed. "
            "3. Udyam MSME Registration Certificate: Valid 19-digit Udyam Registration Number. "
            "4. Premises Title: Registered Deed of Land/Building or Industrial Estate Allotment Letter from State Industrial Infrastructure Corporation. "
            "5. Bank Account Proof: Cancelled Cheque or Bank Statement of the business account (last 3 months)."
        ),
    },
    {
        "service_id": "business-license",
        "title": "Business License Procedures & Fast-Track Windows",
        "category": "steps",
        "source_name": "National Single Window System (NSWS)",
        "source_url": "https://nsws.gov.in",
        "document_type": "GUIDELINE",
        "content": (
            "Application timeline: 10 to 14 working days under the State Single Window Act. "
            "Fee: ₹3,000 for Micro and Small units; ₹7,500 for Medium enterprises. "
            "Approvals are subject to verification of industrial classification code (NIC Code) and zoning approval."
        ),
    },

    # ── Building Permission ────────────────────────────────────────────────────
    {
        "service_id": "building-permission",
        "title": "Building Permission Statutory Bye-Laws & National Building Code",
        "category": "eligibility",
        "source_name": "Urban Development & Town Planning Authority / NBC 2016",
        "source_url": "https://mohua.gov.in",
        "document_type": "ACT",
        "content": (
            "Building Permission is mandatory under Town and Country Planning Acts and the National Building Code (NBC) "
            "prior to commencement of any new construction, structural alteration, demolition, or vertical extension. "
            "It validates Floor Area Ratio (FAR/FSI), setback distances, ground coverage, parking norms, structural safety, "
            "and environmental green cover requirements."
        ),
    },
    {
        "service_id": "building-permission",
        "title": "Required Documents & Architectural Drawings for Building Permission",
        "category": "documents",
        "source_name": "Town Planning Building Bye-laws Checklist",
        "source_url": "https://mohua.gov.in",
        "document_type": "GUIDELINE",
        "content": (
            "Mandatory documents for Building Permission: "
            "1. Registered Title Deed / Sale Deed establishing clear ownership title and non-encumbrance certificate (Form 15/16). "
            "2. Architectural Floor Plans: Detailed floor-wise layout, cross-sections, elevation, and site plan drawn to scale (AutoCAD / PDF) certified by a Council of Architecture (CoA) registered architect. "
            "3. Structural Stability Certificate: Endorsed by a licensed Chartered Structural Engineer confirming seismic zone IV/III compliance. "
            "4. Land Revenue Sanction (Katha / Mutation Certificate): Extract confirming residential/commercial land-use conversion. "
            "5. Fire Services & Environmental NOC: Required for buildings exceeding 15 meters in height or built-up area > 20,000 sq.m."
        ),
    },
    {
        "service_id": "building-permission",
        "title": "Building Permission Fees & Scrutiny Process",
        "category": "fees",
        "source_name": "Town Planning Urban Local Bodies Schedule",
        "source_url": "https://mohua.gov.in",
        "document_type": "REGULATION",
        "content": (
            "Fees comprise scrutiny fee (₹15 per sq.m of total built-up area) plus development charges and infrastructure cess. "
            "Processing timeline: 21 to 30 working days. "
            "Commencement Certificate (CC) is issued after initial site alignment inspection; Occupancy Certificate (OC) requires final completion scrutiny."
        ),
    },

    # ── Factory Registration ───────────────────────────────────────────────────
    {
        "service_id": "factory-registration",
        "title": "Factories Act 1948 Statutory Provisions",
        "category": "eligibility",
        "source_name": "Directorate of Industrial Safety & Health / Factories Act 1948",
        "source_url": "https://labour.gov.in",
        "document_type": "ACT",
        "content": (
            "Under Section 6 of the Factories Act, 1948, any manufacturing facility engaging ten (10) or more workers "
            "with the aid of electric power, or twenty (20) or more workers without power, must obtain prior approval of "
            "plans and a Factory License from the Chief Inspector of Factories. It mandates occupational health, effluent "
            "containment, emergency exits, machine guarding, and welfare provisions."
        ),
    },
    {
        "service_id": "factory-registration",
        "title": "Required Documents for Factory Registration",
        "category": "documents",
        "source_name": "Inspectorate of Factories Citizen Charter",
        "source_url": "https://labour.gov.in",
        "document_type": "GUIDELINE",
        "content": (
            "Required documents: "
            "1. Form 1 & Form 2: Prescribed statutory application forms detailing manufacturing flow and maximum daily workforce. "
            "2. Certified Plant Layout Plans: Scale drawings indicating machinery placement, ventilation shafts, internal gangways (min 1.2m), and fire escape staircases. "
            "3. Power Allocation Sanction: Official power feasibility sanction letter from the State Electricity Distribution Board (DISCOM). "
            "4. Manufacturing Process Flowchart & Raw Material Data: Detailed chemical/physical transformation flowchart, including hazardous substance inventory (Material Safety Data Sheets). "
            "5. Ownership/Lease Agreement of Industrial Plot: Approved Industrial Park allotment or industrial zone land title."
        ),
    },
    {
        "service_id": "factory-registration",
        "title": "Factory License Fees, Renewal & Safety Inspection",
        "category": "fees",
        "source_name": "Inspectorate of Factories Rules",
        "source_url": "https://labour.gov.in",
        "document_type": "REGULATION",
        "content": (
            "Fee is calculated as a matrix of Installed Horsepower (HP) and Maximum Number of Workers (ranges from ₹3,000 to ₹25,000). "
            "Processing timeline: 20 to 30 working days. "
            "Pre-commissioning inspection is conducted by the Factory Inspector. Licenses can be renewed for 5 to 10 years."
        ),
    },

    # ── Pollution Certificate ──────────────────────────────────────────────────
    {
        "service_id": "pollution-certificate",
        "title": "Pollution Control Board Consent to Establish (CTE) & Operate (CTO)",
        "category": "eligibility",
        "source_name": "Central Pollution Control Board (CPCB) / Water & Air Acts",
        "source_url": "https://cpcb.nic.in",
        "document_type": "ACT",
        "content": (
            "Under Section 25 of the Water (Prevention and Control of Pollution) Act 1974 and Section 21 of the "
            "Air (Prevention and Control of Pollution) Act 1981, all industrial and commercial establishments categorized "
            "under Red, Orange, Green, and White categories must secure Consent to Establish (CTE) before construction "
            "and Consent to Operate (CTO) prior to discharge of emissions or trade effluents."
        ),
    },
    {
        "service_id": "pollution-certificate",
        "title": "Required Documents for Pollution Board Consent",
        "category": "documents",
        "source_name": "Pollution Control Board Consent Management Guidelines",
        "source_url": "https://cpcb.nic.in",
        "document_type": "GUIDELINE",
        "content": (
            "Required documentation for CTE/CTO: "
            "1. Detailed Project Report (DPR): Comprehensive manufacturing process description, water balance diagram, and expected solid/hazardous waste generation. "
            "2. Effluent Treatment Plant (ETP) / Sewage Treatment Plant (STP) Engineering Design: Schematic flow diagram and hydraulic capacity calculations. "
            "3. Air Pollution Control Measures: Technical specs of chimneys/stacks, bag filters, wet scrubbers, and acoustic enclosures for Diesel Generator (DG) sets. "
            "4. Environmental Management Plan (EMP): Rainwater harvesting plan and green belt development (min 33% of plot area). "
            "5. Land Ownership or Industrial Zone Clearance: Land allotment letter or conversion order."
        ),
    },
    {
        "service_id": "pollution-certificate",
        "title": "Pollution Consent Classification & Processing Times",
        "category": "fees",
        "source_name": "Pollution Control Board Consent Manual",
        "source_url": "https://cpcb.nic.in",
        "document_type": "REGULATION",
        "content": (
            "Categorization: Red (Heavy pollution, e.g. chemicals/metallurgy - 60 days); Orange (Moderate, e.g. food processing/textiles - 45 days); "
            "Green (Low pollution, e.g. small scale assembling - 30 days); White (Non-polluting, simple online intimation without fee). "
            "CTE is valid for 5 years during construction; CTO is renewable periodically based on annual audit compliance."
        ),
    },

    # ── General Platform Knowledge ─────────────────────────────────────────────
    {
        "service_id": None,
        "title": "GovEaseAI Platform Architecture & Assistance Protocol",
        "category": "official_source",
        "source_name": "GovEaseAI Government Service Portal Manual",
        "source_url": "https://goveaseai.local",
        "document_type": "GUIDELINE",
        "content": (
            "GovEaseAI is an AI-assisted digital government service platform designed to simplify citizen interactions with "
            "six statutory government departments. The AI Assistant acts in an assistive, advisory capacity: it guides citizens "
            "on document requirements, application form fields, verification feedback, and application tracking. "
            "IMPORTANT: The AI Assistant does NOT possess the legal authority to grant, sanction, approve, or reject applications. "
            "All final decisions remain exclusively with authorized government officers."
        ),
    },
    {
        "service_id": None,
        "title": "How to Track Applications in GovEaseAI",
        "category": "steps",
        "source_name": "GovEaseAI Citizen Portal Guide",
        "source_url": "https://goveaseai.local",
        "document_type": "GUIDELINE",
        "content": (
            "Application tracking workflow: Citizens can navigate to 'My Applications' or enter an Application ID (e.g., GEAI-2026-000001). "
            "Status progression: 1. SUBMITTED -> 2. AI_PROCESSING -> 3. OFFICER_REVIEW -> 4. CORRECTION_REQUIRED (if officer requests changes) "
            "-> 5. RESUBMITTED -> 6. APPROVED -> 7. DIGITAL_APPROVAL. Citizens receive timestamped audit trails and downloadable digital sanction certificates."
        ),
    },
]

DOCUMENT_REQUIREMENTS = [
    # Trade License
    {"service_id": "trade-license", "document_type": "IDENTITY_PROOF", "document_name": "Aadhaar Card / PAN Card", "description": "Government issued photo identity of applicant/proprietor", "required": True, "accepted_formats": ["PDF", "PNG", "JPG"], "verification_rules": "Name must match applicant full name exactly", "display_order": 1},
    {"service_id": "trade-license", "document_type": "PREMISES_PROOF", "document_name": "Property Tax Receipt / Lease Deed", "description": "Latest property tax paid challan or registered rent agreement with landlord NOC", "required": True, "accepted_formats": ["PDF", "PNG", "JPG"], "verification_rules": "Address must match commercial business address", "display_order": 2},
    {"service_id": "trade-license", "document_type": "BUSINESS_PROOF", "document_name": "GST Certificate / Incorporation Proof", "description": "GST registration certificate or certificate of incorporation", "required": True, "accepted_formats": ["PDF", "PNG", "JPG"], "verification_rules": "Legal business entity name must match application", "display_order": 3},
    {"service_id": "trade-license", "document_type": "FIRE_NOC", "document_name": "Fire Department NOC", "description": "Required if commercial area exceeds 500 sq.ft or hazardous goods handled", "required": False, "accepted_formats": ["PDF"], "verification_rules": "Must be valid and issued by State Fire Services", "display_order": 4},

    # Shop Registration
    {"service_id": "shop-registration", "document_type": "EMPLOYER_ID", "document_name": "Aadhaar / Voter ID of Employer", "description": "Identity proof of shop owner or primary partner", "required": True, "accepted_formats": ["PDF", "PNG", "JPG"], "verification_rules": "Full name must match applicant name", "display_order": 1},
    {"service_id": "shop-registration", "document_type": "SHOP_ADDRESS_PROOF", "document_name": "Electricity Bill / Utility Bill", "description": "Proof of establishment premises", "required": True, "accepted_formats": ["PDF", "PNG", "JPG"], "verification_rules": "Address must match establishment address", "display_order": 2},
    {"service_id": "shop-registration", "document_type": "SHOP_FRONT_PHOTO", "document_name": "Shop Frontage Photograph", "description": "Clear exterior photo of shop entrance displaying bilingual nameboard", "required": True, "accepted_formats": ["PNG", "JPG", "WEBP"], "verification_rules": "Name board clearly visible in photo", "display_order": 3},
    {"service_id": "shop-registration", "document_type": "EMPLOYEE_LIST", "document_name": "List of Employees (Form A)", "description": "Roster of workers with designations and joining dates", "required": False, "accepted_formats": ["PDF"], "verification_rules": "Applicable if 1 or more workers employed", "display_order": 4},

    # Business License
    {"service_id": "business-license", "document_type": "APPLICANT_ID", "document_name": "PAN & Aadhaar of Authorized Signatory", "description": "Primary identity of authorized business representative", "required": True, "accepted_formats": ["PDF", "PNG", "JPG"], "verification_rules": "PAN checksum verified", "display_order": 1},
    {"service_id": "business-license", "document_type": "UDYAM_CERT", "document_name": "Udyam MSME Registration Certificate", "description": "Ministry of MSME 19-digit registration certificate", "required": True, "accepted_formats": ["PDF"], "verification_rules": "Udyam number format UDYAM-XX-00-0000000", "display_order": 2},
    {"service_id": "business-license", "document_type": "CONSTITUTION_DOC", "document_name": "MOA / AOA / Partnership Deed", "description": "Constitutional charter of business entity", "required": True, "accepted_formats": ["PDF"], "verification_rules": "Registered with ROC or Registrar of Firms", "display_order": 3},
    {"service_id": "business-license", "document_type": "BANK_STATEMENT", "document_name": "Bank Statement / Cancelled Cheque", "description": "Current business bank account statement (last 3 months)", "required": True, "accepted_formats": ["PDF"], "verification_rules": "Entity name matches business name", "display_order": 4},

    # Building Permission
    {"service_id": "building-permission", "document_type": "TITLE_DEED", "document_name": "Registered Sale Deed / Title Deed", "description": "Proof of absolute freehold ownership with encumbrance certificate", "required": True, "accepted_formats": ["PDF"], "verification_rules": "Clear legal title verified", "display_order": 1},
    {"service_id": "building-permission", "document_type": "ARCHITECT_PLANS", "document_name": "Architectural Floor Plans (AutoCAD / PDF)", "description": "Site plan, floor plans, sections, and elevation certified by CoA registered architect", "required": True, "accepted_formats": ["PDF"], "verification_rules": "CoA registration number and stamp required", "display_order": 2},
    {"service_id": "building-permission", "document_type": "STRUCTURAL_STABILITY", "document_name": "Structural Stability Certificate", "description": "Endorsed by chartered structural engineer confirming seismic resistance", "required": True, "accepted_formats": ["PDF"], "verification_rules": "Structural engineer license validation", "display_order": 3},
    {"service_id": "building-permission", "document_type": "LAND_CONVERSION", "document_name": "Land Conversion Order (NA / Katha)", "description": "Non-Agricultural land use conversion sanction from Revenue Department", "required": True, "accepted_formats": ["PDF"], "verification_rules": "Valid conversion order number", "display_order": 4},

    # Factory Registration
    {"service_id": "factory-registration", "document_type": "FORM_1_2", "document_name": "Prescribed Form 1 & Form 2", "description": "Statutory application forms under Section 6 of Factories Act", "required": True, "accepted_formats": ["PDF"], "verification_rules": "Signed by Occupier and Factory Manager", "display_order": 1},
    {"service_id": "factory-registration", "document_type": "PLANT_LAYOUT", "document_name": "Certified Plant Machinery Layout Plans", "description": "Drawings showing machine coordinates, ventilation, emergency passages", "required": True, "accepted_formats": ["PDF"], "verification_rules": "Scale 1:100 with clear escape routes", "display_order": 2},
    {"service_id": "factory-registration", "document_type": "POWER_SANCTION", "document_name": "DISCOM Power Allocation Sanction", "description": "Electricity Board connected load sanction letter", "required": True, "accepted_formats": ["PDF"], "verification_rules": "Connected HP capacity matches Form 1", "display_order": 3},
    {"service_id": "factory-registration", "document_type": "PROCESS_FLOW", "document_name": "Process Flow Diagram & MSDS", "description": "Manufacturing flowchart and chemical hazard data sheets", "required": True, "accepted_formats": ["PDF"], "verification_rules": "Hazardous chemicals explicitly cataloged", "display_order": 4},

    # Pollution Certificate
    {"service_id": "pollution-certificate", "document_type": "DPR_FLOW", "document_name": "Detailed Project Report & Water Balance", "description": "Report indicating manufacturing processes and water consumption / effluent generation", "required": True, "accepted_formats": ["PDF"], "verification_rules": "Water balance input = output + loss verified", "display_order": 1},
    {"service_id": "pollution-certificate", "document_type": "ETP_DESIGN", "document_name": "ETP / STP Engineering Design Schematics", "description": "Treatment scheme showing primary, secondary, and tertiary treatment units", "required": True, "accepted_formats": ["PDF"], "verification_rules": "Design conforms to CPCB discharge standards", "display_order": 2},
    {"service_id": "pollution-certificate", "document_type": "AIR_CONTROL", "document_name": "Air Pollution Control Equipment Specs", "description": "Chimney height calculation and scrubber / bag filter specs", "required": True, "accepted_formats": ["PDF"], "verification_rules": "Minimum stack height conforms to 14 * Q^0.3 formula", "display_order": 3},
    {"service_id": "pollution-certificate", "document_type": "EMP_PLAN", "document_name": "Environmental Management Plan (EMP)", "description": "Greenbelt plantation layout and rainwater harvesting plan", "required": True, "accepted_formats": ["PDF"], "verification_rules": "Min 33% plot area designated greenbelt", "display_order": 4},
]

APPLICATION_STEPS = [
    # Trade License
    {"service_id": "trade-license", "step_number": 1, "title": "Service Selection", "description": "Select Trade License category and municipal ward", "route": "/services/trade-license", "required": True},
    {"service_id": "trade-license", "step_number": 2, "title": "Business Information", "description": "Provide commercial trade details, floor area, and operating hours", "route": "/applications/new/trade-license", "required": True},
    {"service_id": "trade-license", "step_number": 3, "title": "Document Upload", "description": "Upload Identity Proof, Property Tax / Lease Deed, and Business Proof", "route": "/applications/:id/documents", "required": True},
    {"service_id": "trade-license", "step_number": 4, "title": "AI Document Verification", "description": "Automated OCR extraction and cross-verification of uploaded documents", "route": "/applications/:id/documents", "required": True},
    {"service_id": "trade-license", "step_number": 5, "title": "Citizen Final Review", "description": "Review application details and AI verification flags before submission", "route": "/applications/:id", "required": True},
    {"service_id": "trade-license", "step_number": 6, "title": "Municipal Officer Review", "description": "Authorized licensing officer examines application and conducts desk scrutiny", "route": "/officer/applications/:id", "required": True},
    {"service_id": "trade-license", "step_number": 7, "title": "Digital Approval Issued", "description": "Officer approval grants digitally signed Trade License certificate", "route": "/applications/:id/approval", "required": True},

    # Shop Registration
    {"service_id": "shop-registration", "step_number": 1, "title": "Establishment Details", "description": "Enter shop name, employer details, and category of establishment", "route": "/applications/new/shop-registration", "required": True},
    {"service_id": "shop-registration", "step_number": 2, "title": "Upload Proofs & Photos", "description": "Upload employer ID, utility bill, shop frontage photo, and employee list", "route": "/applications/:id/documents", "required": True},
    {"service_id": "shop-registration", "step_number": 3, "title": "AI Scrutiny & Cross-Check", "description": "AI verifies establishment address and employer name match", "route": "/applications/:id/documents", "required": True},
    {"service_id": "shop-registration", "step_number": 4, "title": "Labour Officer Review", "description": "Labour Inspector inspects registration request and statutory employee count", "route": "/officer/applications/:id", "required": True},
    {"service_id": "shop-registration", "step_number": 5, "title": "Registration Certificate", "description": "Issuance of 5-year Shop Registration Certificate with QR Code", "route": "/applications/:id/approval", "required": True},

    # Building Permission
    {"service_id": "building-permission", "step_number": 1, "title": "Plot & Land Particulars", "description": "Enter survey number, plot dimensions, zone, and intended building use", "route": "/applications/new/building-permission", "required": True},
    {"service_id": "building-permission", "step_number": 2, "title": "Architectural Uploads", "description": "Upload title deed, CoA architect plans, and structural stability certificates", "route": "/applications/:id/documents", "required": True},
    {"service_id": "building-permission", "step_number": 3, "title": "AI Compliance Check", "description": "Automated verification of setback distances, FAR, and engineer credentials", "route": "/applications/:id/documents", "required": True},
    {"service_id": "building-permission", "step_number": 4, "title": "Town Planning Officer Scrutiny", "description": "Town Planning Officer conducts regulatory scrutiny and site verification", "route": "/officer/applications/:id", "required": True},
    {"service_id": "building-permission", "step_number": 5, "title": "Commencement Sanction", "description": "Official Building Sanction Plan and Commencement Certificate issued", "route": "/applications/:id/approval", "required": True},
]

def seed_knowledge_base():
    db = SessionLocal()
    try:
        # Clear existing knowledge tables to allow idempotency
        db.query(ServiceKnowledgeDocument).delete()
        db.query(ServiceDocumentRequirement).delete()
        db.query(ServiceApplicationStep).delete()
        db.commit()

        # Seed Knowledge Documents
        for item in KNOWLEDGE_DOCUMENTS:
            doc = ServiceKnowledgeDocument(
                id=str(uuid.uuid4()),
                service_id=item["service_id"],
                title=item["title"],
                content=item["content"],
                category=item["category"],
                source_name=item["source_name"],
                source_url=item["source_url"],
                document_type=item["document_type"],
                version="1.0",
                is_active=True,
            )
            db.add(doc)

        # Seed Document Requirements
        for req in DOCUMENT_REQUIREMENTS:
            doc_req = ServiceDocumentRequirement(
                id=f"req-{req['service_id']}-{req['document_type'].lower()}",
                service_id=req["service_id"],
                document_type=req["document_type"],
                document_name=req["document_name"],
                description=req["description"],
                required=req["required"],
                accepted_formats=req["accepted_formats"],
                verification_rules=req["verification_rules"],
                display_order=req["display_order"],
            )
            db.add(doc_req)

        # Seed Application Steps
        for step in APPLICATION_STEPS:
            app_step = ServiceApplicationStep(
                id=f"step-{step['service_id']}-{step['step_number']}",
                service_id=step["service_id"],
                step_number=step["step_number"],
                title=step["title"],
                description=step["description"],
                route=step["route"],
                required=step["required"],
            )
            db.add(app_step)

        db.commit()
        print(f"Successfully seeded: {len(KNOWLEDGE_DOCUMENTS)} knowledge documents, "
              f"{len(DOCUMENT_REQUIREMENTS)} document requirements, "
              f"{len(APPLICATION_STEPS)} application steps.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding knowledge base: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_knowledge_base()
