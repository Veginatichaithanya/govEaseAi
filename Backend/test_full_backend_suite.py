import requests
import json
import uuid
import sys

BASE_URL = "http://127.0.0.1:5000"

def run_suite():
    results = {}
    print("==================================================")
    print("STARTING GOVEASEAI BACKEND & API AUDIT SUITE")
    print("==================================================")

    # 1. Health / Root
    try:
        r = requests.get(f"{BASE_URL}/")
        print(f"[*] GET / -> {r.status_code}")
        results["root"] = r.status_code == 200
    except Exception as e:
        print(f"[!] Root check failed: {e}")
        results["root"] = False

    # 2. Citizen Authentication Tests
    print("\n--- Phase 7: Citizen Authentication ---")
    # 2a. Correct credentials
    login_payload = {
        "email": "naga@gmail.com",
        "password": "Password@123",
        "role": "CITIZEN"
    }
    r = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    print(f"[*] Citizen Login (Valid): {r.status_code}")
    assert r.status_code == 200, f"Login failed: {r.text}"
    login_data = r.json()
    citizen_token = login_data["token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}
    citizen_id = login_data["user"]["id"]
    print(f"    Citizen ID: {citizen_id}, Name: {login_data['user']['fullName']}")
    results["citizen_login_valid"] = True

    # 2b. Wrong password
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "naga@gmail.com", "password": "WrongPassword!"})
    print(f"[*] Citizen Login (Wrong Password): {r.status_code}")
    results["citizen_login_wrong_pass"] = (r.status_code == 401)

    # 2c. Wrong email
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "nonexistent@gmail.com", "password": "Password@123"})
    print(f"[*] Citizen Login (Wrong Email): {r.status_code}")
    results["citizen_login_wrong_email"] = (r.status_code == 401)

    # 2d. Empty credentials
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "", "password": ""})
    print(f"[*] Citizen Login (Empty): {r.status_code}")
    results["citizen_login_empty"] = (r.status_code in [401, 422])

    # 2e. Phone number login
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"identifier": "9182260865", "password": "Password@123"})
    print(f"[*] Citizen Login (Phone): {r.status_code}")
    results["citizen_login_phone"] = (r.status_code == 200)

    # 3. Citizen Session & Identity
    print("\n--- Phase 8 & 9: Citizen Session & Identity ---")
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=citizen_headers)
    print(f"[*] GET /api/auth/me: {r.status_code}")
    me_data = r.json()
    assert me_data["email"] == "naga@gmail.com"
    results["citizen_session_me"] = (r.status_code == 200)

    # 4. Profile & Completion
    print("\n--- Phase 12 & 13: Citizen Profile & Dynamic Completion ---")
    r = requests.get(f"{BASE_URL}/api/profile/me", headers=citizen_headers)
    print(f"[*] GET /api/profile/me: {r.status_code}, Completion: {r.json().get('profileCompletion')}%")
    initial_completion = r.json().get("profileCompletion")
    results["citizen_profile_get"] = (r.status_code == 200)

    # Update profile
    update_payload = {
        "fullName": "Veginati Chaithanya",
        "city": "Visakhapatnam",
        "district": "Visakhapatnam",
        "state": "Andhra Pradesh",
        "pincode": "530001",
        "occupation": "Software Engineer",
        "education": "Bachelor of Technology"
    }
    r = requests.put(f"{BASE_URL}/api/profile/me", headers=citizen_headers, json=update_payload)
    print(f"[*] PUT /api/profile/me: {r.status_code}, New Completion: {r.json().get('profileCompletion')}%")
    new_completion = r.json().get("profileCompletion")
    results["citizen_profile_update"] = (r.status_code == 200 and new_completion >= initial_completion)

    # 5. Government Services & Mapping
    print("\n--- Phase 14 & 15: Government Services & Department Mapping ---")
    r = requests.get(f"{BASE_URL}/api/services")
    print(f"[*] GET /api/services: {r.status_code}")
    services = r.json()
    print(f"    Found {len(services)} services:")
    expected_mappings = {
        "trade-license": "municipal-licensing",
        "shop-registration": "department-labour",
        "business-license": "directorate-industries",
        "building-permission": "urban-development",
        "factory-registration": "inspectorate-factories",
        "pollution-certificate": "pollution-control"
    }
    all_mapped = True
    for s in services:
        dept_id = s.get("departmentId") or s.get("department_id")
        svc_id = s.get("id")
        exp_dept = expected_mappings.get(svc_id)
        print(f"    - {s.get('name')} ({svc_id}) -> Dept: {dept_id} (Expected: {exp_dept})")
        if dept_id != exp_dept:
            all_mapped = False
    results["services_count"] = (len(services) == 6)
    results["services_mapping"] = all_mapped

    # 6. Officer Authentication across all 6 departments
    print("\n--- Phase 29 & 30: Officer Authentication across 6 Departments ---")
    officers = [
        {"dept": "municipal-licensing", "email": "licensing@goveaseai.gov", "pass": "License@123"},
        {"dept": "department-labour", "email": "labour@goveaseai.gov", "pass": "Labour@123"},
        {"dept": "directorate-industries", "email": "industry@goveaseai.gov", "pass": "Industry@123"},
        {"dept": "urban-development", "email": "building@goveaseai.gov", "pass": "Building@123"},
        {"dept": "inspectorate-factories", "email": "factory@goveaseai.gov", "pass": "Factory@123"},
        {"dept": "pollution-control", "email": "pollution@goveaseai.gov", "pass": "Pollution@123"}
    ]
    officer_tokens = {}
    all_officers_login = True
    for o in officers:
        r = requests.post(f"{BASE_URL}/api/auth/officer/login", json={
            "department": o["dept"],
            "email": o["email"],
            "password": o["pass"]
        })
        print(f"[*] Officer Login [{o['dept']}]: {r.status_code}")
        if r.status_code == 200:
            officer_tokens[o["dept"]] = r.json()["access_token"]
        else:
            print(f"    Failed: {r.text}")
            all_officers_login = False
    results["all_officers_login"] = all_officers_login

    # Wrong officer password
    r = requests.post(f"{BASE_URL}/api/auth/officer/login", json={
        "department": "municipal-licensing",
        "email": "licensing@goveaseai.gov",
        "password": "WrongPassword!"
    })
    results["officer_wrong_password"] = (r.status_code == 401)

    # Wrong department for officer (Cross-department login denial)
    r = requests.post(f"{BASE_URL}/api/auth/officer/login", json={
        "department": "pollution-control",
        "email": "licensing@goveaseai.gov",
        "password": "License@123"
    })
    print(f"[*] Officer Login (Mismatched Department): {r.status_code}")
    results["officer_dept_mismatch_denied"] = (r.status_code == 403)

    # 7. Complete End-to-End Application Lifecycle (Phases 16, 17, 18, 19, 20, 28, 33, 34, 35, 36, 37, 38, 40, 41, 42)
    print("\n--- Phases 16-42: Complete End-to-End Application Lifecycle ---")
    # Step 1: Citizen creates Trade License Draft
    create_payload = {
        "serviceId": "trade-license",
        "initialFormData": {
            "applicantName": "Veginati Chaithanya",
            "businessName": "GovEase Tech Innovations",
            "businessType": "Retail",
            "tradeAddress": "12-34 Main Street, Visakhapatnam",
            "mobile": "9182260869",
            "email": "naga@gmail.com"
        }
    }
    r = requests.post(f"{BASE_URL}/api/applications", headers=citizen_headers, json=create_payload)
    print(f"[*] Citizen Create Application: {r.status_code}")
    assert r.status_code == 200, f"Failed to create app: {r.text}"
    app_data = r.json()
    app_id = app_data["id"]
    print(f"    Created Application ID: {app_id}, Status: {app_data['status']}, Dept: {app_data['departmentId']}")
    assert app_data["status"] == "DRAFT"
    results["app_create_draft"] = True

    # Step 2: Save Draft / Update Form Data
    update_payload = {
        "currentStep": 3,
        "formData": {
            "annualTurnover": "500000",
            "premisesType": "Owned",
            "commencementDate": "2026-01-01"
        }
    }
    r = requests.put(f"{BASE_URL}/api/applications/{app_id}", headers=citizen_headers, json=update_payload)
    print(f"[*] Save Draft / Update: {r.status_code}, Step: {r.json()['currentStep']}")
    results["app_save_draft"] = (r.status_code == 200 and r.json()["currentStep"] == 3)

    # Step 3: Upload Document (PDF & PNG)
    dummy_pdf_content = b"%PDF-1.4 Mock GovEaseAI verification document content for statutory testing"
    files = {
        "file": ("id_proof.pdf", dummy_pdf_content, "application/pdf")
    }
    data = {
        "documentId": "id_proof_doc_1",
        "documentName": "Identity Proof (Aadhaar / PAN)"
    }
    r = requests.post(f"{BASE_URL}/api/applications/{app_id}/documents", headers=citizen_headers, files=files, data=data)
    print(f"[*] Upload Document: {r.status_code}")
    results["document_upload"] = (r.status_code == 200)

    # Step 4: Citizen Submits Application
    r = requests.post(f"{BASE_URL}/api/applications/{app_id}/submit", headers=citizen_headers)
    print(f"[*] Citizen Submit Application: {r.status_code}, Status: {r.json()['status']}")
    assert r.status_code == 200
    assert r.json()["status"] == "SUBMITTED"
    results["app_submit"] = True

    # Step 5: Officer Queue Verification (Municipal Licensing officer)
    mld_token = officer_tokens.get("municipal-licensing")
    mld_headers = {"Authorization": f"Bearer {mld_token}"}
    r = requests.get(f"{BASE_URL}/api/officer/applications", headers=mld_headers)
    print(f"[*] Officer GET /applications (MLD): {r.status_code}, Total: {len(r.json())}")
    mld_apps = [a["id"] for a in r.json()]
    assert app_id in mld_apps, "Submitted application not in MLD officer queue!"
    results["officer_queue_contains_app"] = True

    # Step 6: Cross-department isolation check (Labour officer trying to access MLD application)
    labour_token = officer_tokens.get("department-labour")
    labour_headers = {"Authorization": f"Bearer {labour_token}"}
    r = requests.get(f"{BASE_URL}/api/officer/applications/{app_id}", headers=labour_headers)
    print(f"[*] Cross-Department Access Attempt (Labour -> MLD app): {r.status_code}")
    results["cross_dept_isolation"] = (r.status_code == 403)

    # Step 7: Officer Requests Correction
    corr_payload = {
        "remarks": "Please provide updated electricity bill matching the trade address.",
        "officerName": "S. Narayanan"
    }
    r = requests.post(f"{BASE_URL}/api/officer/applications/{app_id}/correction", headers=mld_headers, json=corr_payload)
    print(f"[*] Officer Request Correction: {r.status_code}, Status: {r.json()['status']}")
    assert r.status_code == 200
    assert r.json()["status"] == "CORRECTION_REQUIRED"
    results["officer_request_correction"] = True

    # Step 8: Citizen checks status and notifications
    r = requests.get(f"{BASE_URL}/api/applications/{app_id}", headers=citizen_headers)
    print(f"[*] Citizen Check Application after Correction: Status: {r.json()['status']}, Remarks: {r.json().get('officerRemarks')}")
    assert r.json()["status"] == "CORRECTION_REQUIRED"
    
    r = requests.get(f"{BASE_URL}/api/notifications", headers=citizen_headers)
    print(f"[*] Citizen GET /notifications: {r.status_code}, Count: {len(r.json())}")
    has_corr_notif = any(app_id in n.get("actionUrl", "") or app_id in n.get("description", "") for n in r.json())
    results["citizen_correction_notif"] = has_corr_notif

    # Step 9: Citizen Resubmits Application
    resubmit_payload = {
        "formData": {
            "electricityBillNo": "EB-987654321",
            "tradeAddress": "12-34 Main Street, Updated Landmark, Visakhapatnam"
        }
    }
    r = requests.post(f"{BASE_URL}/api/applications/{app_id}/resubmit", headers=citizen_headers, json=resubmit_payload)
    print(f"[*] Citizen Resubmit Application: {r.status_code}, Status: {r.json()['status']}")
    assert r.status_code == 200
    assert r.json()["status"] == "RESUBMITTED"
    results["citizen_resubmit"] = True

    # Step 10: Officer Reviews and Approves
    approve_payload = {
        "remarks": "All statutory requirements verified and found in order. Digital Trade License approved.",
        "officerName": "S. Narayanan"
    }
    r = requests.post(f"{BASE_URL}/api/officer/applications/{app_id}/approve", headers=mld_headers, json=approve_payload)
    print(f"[*] Officer Approve Application: {r.status_code}, Status: {r.json()['status']}, Ref: {r.json().get('approvalReference')}")
    assert r.status_code == 200
    assert r.json()["status"] == "APPROVED"
    assert r.json().get("approvalReference") is not None
    results["officer_approve"] = True

    # Step 11: Citizen Views Approved Application and Timeline
    r = requests.get(f"{BASE_URL}/api/applications/{app_id}", headers=citizen_headers)
    print(f"[*] Citizen Check Approved App: Status: {r.json()['status']}, Ref: {r.json().get('approvalReference')}")
    assert r.json()["status"] == "APPROVED"
    results["citizen_view_approved"] = True

    r = requests.get(f"{BASE_URL}/api/applications/{app_id}/timeline", headers=citizen_headers)
    print(f"[*] GET Timeline: {r.status_code}, Events: {len(r.json())}")
    events = [e["actionType"] for e in r.json()]
    print(f"    Timeline Events: {' -> '.join(events)}")
    assert "APPLICATION_CREATED" in events
    assert "APPLICATION_SUBMITTED" in events
    assert "CORRECTION_REQUESTED" in events
    assert "APPLICATION_RESUBMITTED" in events
    assert "APPLICATION_APPROVED" in events
    results["application_timeline_complete"] = True

    # 8. Test Rejection flow on second application (Phase 39)
    print("\n--- Phase 39: Officer Rejection Workflow ---")
    r = requests.post(f"{BASE_URL}/api/applications", headers=citizen_headers, json={
        "serviceId": "shop-registration",
        "initialFormData": {"shopName": "Test Reject Shop", "owner": "Veginati Chaithanya"}
    })
    app_reject_id = r.json()["id"]
    requests.post(f"{BASE_URL}/api/applications/{app_reject_id}/submit", headers=citizen_headers)
    
    # Labour officer rejects
    r = requests.post(f"{BASE_URL}/api/officer/applications/{app_reject_id}/reject", headers=labour_headers, json={
        "remarks": "Incomplete documentation submitted; commercial zone clearance missing.",
        "officerName": "P. Ramesh Babu"
    })
    print(f"[*] Officer Reject Application: {r.status_code}, Status: {r.json()['status']}")
    assert r.status_code == 200
    assert r.json()["status"] == "REJECTED"
    results["officer_rejection_flow"] = True

    # 9. Test AI Guidance & Conversations (Phases 24, 25, 26, 27)
    print("\n--- Phases 24-27: AI Assistant & Service Isolation ---")
    # Create conversation for Trade License
    r = requests.post(f"{BASE_URL}/api/ai/conversations", headers=citizen_headers, json={
        "serviceId": "trade-license",
        "title": "Trade License Eligibility Query"
    })
    print(f"[*] Create AI Conversation: {r.status_code}")
    conv_id = r.json().get("id") or r.json().get("conversationId")
    results["ai_create_conversation"] = (r.status_code in [200, 201])

    # Send message in conversation
    r = requests.post(f"{BASE_URL}/api/ai/guidance", headers=citizen_headers, json={
        "serviceId": "trade-license",
        "query": "What are the required documents for a Trade License?",
        "conversationId": conv_id
    })
    print(f"[*] AI Guidance Query: {r.status_code}")
    results["ai_guidance_response"] = (r.status_code == 200)

    # 10. Officer Stats
    print("\n--- Phase 31: Officer Stats ---")
    r = requests.get(f"{BASE_URL}/api/officer/stats", headers=mld_headers)
    print(f"[*] Officer Stats (MLD): {r.status_code}, Data: {r.json()}")
    results["officer_stats"] = (r.status_code == 200)

    # 11. Authorization Checks (Phase 48)
    print("\n--- Phase 48: Strict Authorization Verification ---")
    # Citizen accessing officer endpoint
    r = requests.get(f"{BASE_URL}/api/officer/applications", headers=citizen_headers)
    print(f"[*] Citizen accessing /api/officer/applications: {r.status_code}")
    results["citizen_officer_denial"] = (r.status_code == 403)

    # Unauthenticated access
    r = requests.get(f"{BASE_URL}/api/applications")
    print(f"[*] Unauthenticated /api/applications: {r.status_code}")
    results["unauthenticated_denial"] = (r.status_code == 401)

    print("\n==================================================")
    print("ALL API TESTS COMPLETED!")
    print("Results Summary:")
    for k, v in results.items():
        status_str = "PASS" if v else "FAIL"
        print(f"  {k}: {status_str}")
    print("==================================================")
    return results

if __name__ == "__main__":
    res = run_suite()
    all_pass = all(res.values())
    sys.exit(0 if all_pass else 1)
