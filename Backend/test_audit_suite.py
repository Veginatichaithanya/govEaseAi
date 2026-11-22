import urllib.request
import urllib.error
import json
from app.database import SessionLocal
from app.models.user import User
from app.models.department import GovernmentDepartment
from app.models.service import GovernmentService
from app.models.application import Application

BASE_URL = 'http://127.0.0.1:5000/api'

def api_request(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except:
            return e.code, {"raw": raw}

def verify_all():
    print("=== 1. DATABASE RECORD COUNTS ===")
    db = SessionLocal()
    citizens = db.query(User).filter(User.role == "CITIZEN").all()
    officers = db.query(User).filter(User.role == "OFFICER").all()
    depts = db.query(GovernmentDepartment).all()
    services = db.query(GovernmentService).all()
    apps = db.query(Application).all()

    print(f"Citizens count: {len(citizens)}")
    assert len(citizens) == 1, f"Expected 1 citizen, found {len(citizens)}"
    c = citizens[0]
    print(f"Preserved Citizen: {c.full_name} | Email: {c.email} | Phone: {c.phone} | ApplicantID: {c.applicant_id}")
    assert c.full_name == "Veginati Chaithanya"
    assert c.id == "56c093eb-6fb9-4d11-83b3-474ab2cef3a4"

    print(f"Officers count: {len(officers)}")
    assert len(officers) == 12, f"Expected 12 officers, found {len(officers)}"

    print(f"Departments count: {len(depts)}")
    assert len(depts) == 6, f"Expected 6 departments, found {len(depts)}"

    print(f"Services count: {len(services)}")
    assert len(services) == 6, f"Expected 6 services, found {len(services)}"

    print(f"Applications count: {len(apps)}")
    db.close()

    print("\n=== 2. CITIZEN LOGIN VERIFICATION ===")
    # Wrong password test
    status, res = api_request("POST", "/auth/login", {"identifier": "naga@gmail.com", "password": "WrongPassword123"})
    print(f"Wrong password test: HTTP {status} (Expected 401)")
    assert status == 401, f"Expected 401, got {status}"

    # Correct password test
    status, res = api_request("POST", "/auth/login", {"identifier": "naga@gmail.com", "password": "Password@123"})
    print(f"Citizen login test: HTTP {status}")
    assert status == 200, f"Citizen login failed: {res}"
    cit_user = res.get("user", {})
    name = cit_user.get("fullName")
    app_id = cit_user.get("applicantId")
    print(f"Citizen authenticated: {name} (Applicant ID: {app_id})")
    assert name == "Veginati Chaithanya"
    citizen_token = res.get("access_token")

    print("\n=== 3. ALL 6 DEPARTMENT OFFICERS VERIFICATION ===")
    officers_test = [
        ("municipal-licensing", "licensing@goveaseai.gov", "License@123", "S. Narayanan", "MLD"),
        ("department-labour", "labour@goveaseai.gov", "Labour@123", "P. Ramesh Babu", "DOL"),
        ("directorate-industries", "industry@goveaseai.gov", "Industry@123", "K. Ananya Sharma", "DOI"),
        ("urban-development", "building@goveaseai.gov", "Building@123", "M. Venkat Reddy", "UDTP"),
        ("inspectorate-factories", "factory@goveaseai.gov", "Factory@123", "G. Harish Chandra", "IOF"),
        ("pollution-control", "pollution@goveaseai.gov", "Pollution@123", "Dr. S. Radhika", "PCB"),
    ]

    for dept_id, email, pwd, expected_name, dept_code in officers_test:
        status, off_res = api_request("POST", "/auth/officer/login", {
            "department": dept_id,
            "email": email,
            "password": pwd
        })
        assert status == 200, f"Login failed for {dept_id}: {off_res}"
        u = off_res["user"]
        u_name = u["fullName"]
        u_dept = u["department"]
        print(f"Officer [{dept_code}]: {u_name} ({u_dept}) -> HTTP {status}")
        assert u_name == expected_name
        token = off_res["access_token"]

        # Get stats
        status, stats = api_request("GET", "/officer/dashboard/stats", token=token)
        assert status == 200
        print(f"  Stats: Total={stats['total']}, Pending={stats['pendingReview']}, Approved={stats['approved']}, Rejected={stats['rejected']}")

        # Get apps
        status, apps_list = api_request("GET", "/officer/applications", token=token)
        assert status == 200
        print(f"  Apps in Queue: {len(apps_list)}")

    print("\n=== 4. LIVE APPLICATION WORKFLOW TEST ===")
    # 4.1 Citizen creates application
    status, create_res = api_request("POST", "/applications", {
        "serviceId": "trade-license",
        "initialFormData": {
            "applicantName": "Veginati Chaithanya",
            "businessName": "Chaithanya Tech Solutions",
            "tradeCategory": "Commercial Retail",
            "floorAreaSqFt": "1200",
            "premisesAddress": "Plot 10, HITEC City, Hyderabad"
        }
    }, token=citizen_token)
    assert status == 200, f"App creation failed: {create_res}"
    app_id = create_res["id"]
    print(f"Citizen created application: {app_id}")

    # 4.2 Citizen submits application
    status, sub_res = api_request("POST", f"/applications/{app_id}/submit", token=citizen_token)
    assert status == 200, f"App submit failed: {sub_res}"
    print(f"Citizen submitted application {app_id}: Status={sub_res.get('status')}")

    # 4.3 MLD Officer stats update to 1
    mld_status, mld_login = api_request("POST", "/auth/officer/login", {
        "department": "municipal-licensing",
        "email": "licensing@goveaseai.gov",
        "password": "License@123"
    })
    mld_token = mld_login["access_token"]
    status, mld_stats = api_request("GET", "/officer/dashboard/stats", token=mld_token)
    print(f"MLD Officer Stats after submission: Total={mld_stats['total']}, Pending={mld_stats['pendingReview']}")
    assert mld_stats["total"] == 1, f"Expected total=1, got {mld_stats['total']}"
    assert mld_stats["pendingReview"] == 1, f"Expected pending=1, got {mld_stats['pendingReview']}"

    # 4.4 Labour officer stats remain 0 (isolation test)
    lab_status, lab_login = api_request("POST", "/auth/officer/login", {
        "department": "department-labour",
        "email": "labour@goveaseai.gov",
        "password": "Labour@123"
    })
    lab_token = lab_login["access_token"]
    status, lab_stats = api_request("GET", "/officer/dashboard/stats", token=lab_token)
    print(f"Labour Officer Stats (Department Isolation): Total={lab_stats['total']}")
    assert lab_stats["total"] == 0, f"Expected Labour total=0, got {lab_stats['total']}"

    # 4.5 Labour officer cannot access MLD application
    status, unauth = api_request("GET", f"/officer/applications/{app_id}", token=lab_token)
    print(f"Labour officer cross-department access test: HTTP {status} (Expected 403 Forbidden)")
    assert status == 403, f"Expected 403, got {status}"

    # 4.6 MLD Officer requests correction
    status, corr_res = api_request("POST", f"/officer/applications/{app_id}/correction", {
        "remarks": "Please provide updated registered lease deed."
    }, token=mld_token)
    assert status == 200 and corr_res.get("status") == "CORRECTION_REQUIRED"
    print(f"MLD Officer requested correction: Status={corr_res.get('status')}")

    # Check stats updated
    status, mld_stats = api_request("GET", "/officer/dashboard/stats", token=mld_token)
    assert mld_stats["correctionRequired"] == 1
    print(f"MLD Officer Stats after correction: CorrectionRequired={mld_stats['correctionRequired']}")

    # 4.7 MLD Officer approves application
    status, appr_res = api_request("POST", f"/officer/applications/{app_id}/approve", {
        "remarks": "Statutory requirements fulfilled. Trade License sanctioned."
    }, token=mld_token)
    assert status == 200 and appr_res.get("status") == "APPROVED"
    print(f"MLD Officer approved application: Status={appr_res.get('status')}, Ref={appr_res.get('approvalReference')}")

    # Check stats updated
    status, mld_stats = api_request("GET", "/officer/dashboard/stats", token=mld_token)
    assert mld_stats["approved"] == 1
    print(f"MLD Officer Stats after approval: Approved={mld_stats['approved']}")

    # Cleanup test application
    db = SessionLocal()
    from app.models.activity import ApplicationActivity
    from app.models.notification import Notification
    db.query(ApplicationActivity).filter(ApplicationActivity.application_id == app_id).delete(synchronize_session=False)
    db.query(Notification).filter(Notification.related_application_id == app_id).delete(synchronize_session=False)
    db.query(Application).filter(Application.id == app_id).delete(synchronize_session=False)
    db.commit()
    db.close()
    print("Test application cleaned up successfully.")

    print("\n=== ALL DATABASE AND BACKEND VERIFICATION CHECKS PASSED 100%! ===")

if __name__ == "__main__":
    verify_all()
