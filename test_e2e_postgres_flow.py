import urllib.request
import json
import time
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql+psycopg://postgres:Naga%401432@localhost:5432/goveaseai"
engine = create_engine(DATABASE_URL)

def run_tests():
    print("==================================================")
    print("GovEaseAI End-to-End PostgreSQL Integration Tests")
    print("==================================================")

    # 1. Citizen Login
    print("\n--- TEST 1: Citizen Authentication ---")
    login_payload = json.dumps({"email": "citizen@govease.ai", "password": "Citizen@123", "role": "CITIZEN"}).encode("utf-8")
    req = urllib.request.Request("http://localhost:5000/api/auth/login", data=login_payload, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    citizen_auth = json.loads(res.read())
    citizen_token = citizen_auth["token"]
    citizen_id = citizen_auth["user"]["id"]
    print(f"Citizen Authenticated: {citizen_auth['user']['name']} ({citizen_auth['user']['email']})")
    assert citizen_auth["user"]["role"] == "citizen"

    # 2. Citizen Create Application & Save Draft
    print("\n--- TEST 2: Create Trade License Application & Save Draft ---")
    create_payload = json.dumps({
        "serviceId": "trade-license",
        "initialFormData": {
            "applicantName": "Ravi Kumar",
            "businessName": "Sri Sai E2E Enterprises",
            "premisesAddress": "Plot 999, Madhapur, Hyderabad"
        }
    }).encode("utf-8")
    req = urllib.request.Request("http://localhost:5000/api/applications", data=create_payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {citizen_token}"
    })
    res = urllib.request.urlopen(req)
    new_app = json.loads(res.read())
    app_id = new_app["id"]
    print(f"Created Application: {app_id}, Status: {new_app['status']}")
    assert new_app["status"] == "DRAFT"

    # Verify Draft directly in PostgreSQL
    with engine.connect() as conn:
        row = conn.execute(text("SELECT id, status, citizen_id, form_data FROM applications WHERE id = :id"), {"id": app_id}).fetchone()
        assert row is not None, f"Application {app_id} not found in PostgreSQL!"
        assert row[1] == "DRAFT"
        assert row[3]["businessName"] == "Sri Sai E2E Enterprises"
        print(f"PostgreSQL Verification PASSED: Application {row[0]} exists in database with status '{row[1]}'")

    # 3. Update Draft (Save Draft modification)
    print("\n--- TEST 3: Update Draft (Save Draft Form Data) ---")
    update_payload = json.dumps({
        "formData": {
            "floorAreaSqFt": "850",
            "powerLoadHp": "10 HP"
        },
        "currentStep": 2
    }).encode("utf-8")
    req = urllib.request.Request(f"http://localhost:5000/api/applications/{app_id}", data=update_payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {citizen_token}"
    })
    req.get_method = lambda: "PUT"
    res = urllib.request.urlopen(req)
    updated_app = json.loads(res.read())
    assert updated_app["formData"]["floorAreaSqFt"] == "850"
    print(f"Draft Updated: currentStep={updated_app['currentStep']}, floorAreaSqFt={updated_app['formData']['floorAreaSqFt']}")

    # 4. Citizen Submit Application
    print("\n--- TEST 4: Submit Application ---")
    req = urllib.request.Request(f"http://localhost:5000/api/applications/{app_id}/submit", data=b"{}", headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {citizen_token}"
    })
    res = urllib.request.urlopen(req)
    submitted_app = json.loads(res.read())
    print(f"Submitted Application {app_id}: New Status = {submitted_app['status']}, Step = {submitted_app['currentStep']}")
    assert submitted_app["status"] == "OFFICER_REVIEW"

    # Verify submitted state in PostgreSQL
    with engine.connect() as conn:
        row = conn.execute(text("SELECT status, submitted_at FROM applications WHERE id = :id"), {"id": app_id}).fetchone()
        assert row[0] == "OFFICER_REVIEW"
        assert row[1] is not None
        print(f"PostgreSQL Verification PASSED: Status is now '{row[0]}', submitted_at = {row[1]}")

    # 5. Officer Login (Municipal Licensing Division)
    print("\n--- TEST 5: Officer Login (Municipal Licensing Division) ---")
    officer_payload = json.dumps({
        "email": "trade.officer@govease.ai",
        "password": "Officer@123",
        "departmentId": "municipal-licensing"
    }).encode("utf-8")
    req = urllib.request.Request("http://localhost:5000/api/auth/login", data=officer_payload, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    mld_auth = json.loads(res.read())
    mld_token = mld_auth["token"]
    print(f"Officer Authenticated: {mld_auth['user']['name']} ({mld_auth['user']['departmentName']})")

    # 6. Officer View Department Applications
    print("\n--- TEST 6: Officer View Department Applications Queue ---")
    req = urllib.request.Request("http://localhost:5000/api/officer/applications", headers={"Authorization": f"Bearer {mld_token}"})
    res = urllib.request.urlopen(req)
    officer_apps = json.loads(res.read())
    mld_app_ids = [a["id"] for a in officer_apps]
    assert app_id in mld_app_ids, f"Application {app_id} should appear in MLD officer queue!"
    print(f"MLD Queue contains {len(officer_apps)} applications. Target application {app_id} present: TRUE")

    # 7. Officer Approves Application
    print("\n--- TEST 7: Officer Review & Approval ---")
    approve_payload = json.dumps({
        "remarks": "All commercial trade premises criteria verified. Approved for operations.",
        "officerName": "S. Narayanan"
    }).encode("utf-8")
    req = urllib.request.Request(f"http://localhost:5000/api/officer/applications/{app_id}/approve", data=approve_payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {mld_token}"
    })
    res = urllib.request.urlopen(req)
    approved_app = json.loads(res.read())
    print(f"Application Approved: Status = {approved_app['status']}")
    print(f"Digital Approval Reference: {approved_app['approvalReference']}")
    print(f"Approval Date: {approved_app['approvalDate']}")
    assert approved_app["status"] == "APPROVED"
    assert approved_app["approvalReference"].startswith("GEAI/MLD/")

    # Verify Approval & Activity in PostgreSQL
    with engine.connect() as conn:
        row = conn.execute(text("SELECT status, approval_reference, officer_remarks FROM applications WHERE id = :id"), {"id": app_id}).fetchone()
        assert row[0] == "APPROVED"
        assert row[1] is not None
        print(f"PostgreSQL Verification PASSED: Status '{row[0]}', Ref '{row[1]}'")

        act = conn.execute(text("SELECT action_type, description, actor_name FROM application_activity WHERE application_id = :id ORDER BY created_at DESC LIMIT 1"), {"id": app_id}).fetchone()
        assert act is not None
        print(f"PostgreSQL Activity Event PASSED: '{act[0]}' by '{act[2]}': {act[1]}")

    # 8. Cross-Department Authorization Security Check
    print("\n--- TEST 8: Cross-Department Authorization Security Check ---")
    # Login as Labour Officer
    labour_payload = json.dumps({
        "email": "labour.officer@govease.ai",
        "password": "Officer@123",
        "departmentId": "department-labour"
    }).encode("utf-8")
    req = urllib.request.Request("http://localhost:5000/api/auth/login", data=labour_payload, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    labour_auth = json.loads(res.read())
    labour_token = labour_auth["token"]
    print(f"Logged in as Labour Officer: {labour_auth['user']['name']} ({labour_auth['user']['departmentName']})")

    # Try to access Municipal Trade License Application (should be 403 Forbidden)
    try:
        req = urllib.request.Request(f"http://localhost:5000/api/applications/{app_id}", headers={"Authorization": f"Bearer {labour_token}"})
        res = urllib.request.urlopen(req)
        print("SECURITY FAILURE: Labour officer was improperly granted access to Municipal Trade License!")
        assert False
    except urllib.error.HTTPError as e:
        print(f"SECURITY CHECK PASSED: Labour officer blocked from MLD application with HTTP {e.code} ({e.reason})")
        assert e.code == 403

    # Try to approve Municipal Trade License Application with Labour token (should be 403 Forbidden)
    try:
        req = urllib.request.Request(f"http://localhost:5000/api/officer/applications/{app_id}/approve", data=b"{}", headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {labour_token}"
        })
        res = urllib.request.urlopen(req)
        print("SECURITY FAILURE: Labour officer was improperly allowed to approve Municipal application!")
        assert False
    except urllib.error.HTTPError as e:
        print(f"SECURITY CHECK PASSED: Unauthorized approval blocked with HTTP {e.code} ({e.reason})")
        assert e.code == 403

    print("\n==================================================")
    print("ALL END-TO-END INTEGRATION TESTS PASSED 100%!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
