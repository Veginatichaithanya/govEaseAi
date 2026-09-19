import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://localhost:5000/api"

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

def test_workflow():
    print("=== STARTING FULL REAL-TIME POSTGRESQL VERIFICATION AUDIT ===")

    # 1. Health check
    status, health = api_request("GET", "/health")
    print(f"Health check: HTTP {status}, data: {health}")
    assert status == 200 and health.get("database") == "connected", "DB health check failed!"

    # 2. Login as Citizen (Ravi Kumar)
    status, cit_res = api_request("POST", "/auth/login", {
        "email": "citizen.ravi@govease.ai",
        "password": "Password@123"
    })
    print(f"Citizen login: HTTP {status}")
    assert status == 200, f"Citizen login failed: {cit_res}"
    citizen_token = cit_res["access_token"]
    citizen_id = cit_res["user"]["id"]
    print(f"Authenticated Citizen: {cit_res['user']['fullName']} (ID: {citizen_id})")

    # 3. Create a Trade License Application in PostgreSQL
    status, create_res = api_request("POST", "/applications", {
        "serviceId": "trade-license",
        "initialFormData": {
            "applicantName": "Ravi Kumar",
            "businessName": "Sri Lakshmi Enterprises",
            "tradeCategory": "Commercial Retail",
            "floorAreaSqFt": "1500",
            "premisesAddress": "Plot 42, Jubilee Hills, Road No 36"
        }
    }, token=citizen_token)
    print(f"Citizen created Trade License application: HTTP {status}, ID: {create_res.get('id')}")
    assert status == 200, f"Application creation failed: {create_res}"
    app_id = create_res["id"]

    # 4. Submit the application
    status, submit_res = api_request("POST", f"/applications/{app_id}/submit", token=citizen_token)
    print(f"Citizen submitted application {app_id}: HTTP {status}, Status: {submit_res.get('status')}")
    assert status == 200, f"Application submission failed: {submit_res}"

    # 5. Login as Municipal Licensing Officer
    status, off_res = api_request("POST", "/auth/officer/login", {
        "department": "municipal-licensing",
        "email": "licensing@goveaseai.gov",
        "password": "License@123"
    })
    print(f"Municipal Licensing Officer login: HTTP {status}")
    assert status == 200, f"MLD Officer login failed: {off_res}"
    mld_token = off_res["access_token"]
    print(f"Authenticated Officer: {off_res['user']['fullName']} ({off_res['user']['department']})")

    # 6. Fetch live officer dashboard stats
    status, stats_res = api_request("GET", "/officer/dashboard/stats", token=mld_token)
    print(f"MLD Officer dashboard stats: HTTP {status}, Total: {stats_res.get('total')}, Submitted: {stats_res.get('submitted')}, UnderReview: {stats_res.get('underReview')}")
    assert status == 200, f"Failed to get stats: {stats_res}"

    # 7. Municipal Officer views the submitted application
    status, view_res = api_request("GET", f"/officer/applications/{app_id}", token=mld_token)
    print(f"MLD Officer views application {app_id}: HTTP {status}, Status: {view_res.get('status')}")
    assert status == 200, f"Officer view application failed: {view_res}"

    # 8. Cross-department test: Labour officer attempts to view MLD's application
    status, labour_off = api_request("POST", "/auth/officer/login", {
        "department": "department-labour",
        "email": "labour@goveaseai.gov",
        "password": "Labour@123"
    })
    assert status == 200, f"Labour officer login failed: {labour_off}"
    labour_token = labour_off["access_token"]

    status, unauthorized_res = api_request("GET", f"/officer/applications/{app_id}", token=labour_token)
    print(f"Cross-department unauthorized view test: HTTP {status} (Expected 403 Forbidden)")
    assert status == 403, f"Cross-department leakage detected! Expected 403, got {status}"

    # 9. Municipal Officer requests correction
    status, corr_res = api_request("POST", f"/officer/applications/{app_id}/correction", {
        "remarks": "Please provide updated commercial lease deed with readable boundary schedule."
    }, token=mld_token)
    print(f"Officer requested correction: HTTP {status}, New Status: {corr_res.get('status')}")
    assert status == 200 and corr_res.get("status") == "CORRECTION_REQUIRED", f"Correction request failed: {corr_res}"

    # 10. Check citizen notifications
    status, notifs = api_request("GET", "/notifications", token=citizen_token)
    has_corr_notif = any(n.get("related_application_id") == app_id for n in notifs) if isinstance(notifs, list) else False
    print(f"Citizen received correction notification: {has_corr_notif}")

    # 11. Citizen resubmits
    status, resubmit_res = api_request("PUT", f"/applications/{app_id}", {
        "formData": {
            "applicantName": "Ravi Kumar",
            "businessName": "Sri Lakshmi Enterprises",
            "tradeCategory": "Commercial Retail",
            "floorAreaSqFt": "1500",
            "premisesAddress": "Plot 42, Jubilee Hills, Road No 36, Annexure A attached"
        },
        "currentStep": 4
    }, token=citizen_token)
    print(f"Citizen updated application: HTTP {status}")

    status, resubmit_status = api_request("POST", f"/applications/{app_id}/submit", token=citizen_token)
    print(f"Citizen resubmitted application: HTTP {status}, New Status: {resubmit_status.get('status')}")

    # 12. Officer approves application
    status, approve_res = api_request("POST", f"/officer/applications/{app_id}/approve", {
        "remarks": "All statutory parameters compliant. Trade License granted."
    }, token=mld_token)
    print(f"Officer approved application: HTTP {status}, New Status: {approve_res.get('status')}, Ref: {approve_res.get('approvalReference')}")
    assert status == 200 and approve_res.get("status") == "APPROVED", f"Approval failed: {approve_res}"

    # 13. Test all 6 department officers and their isolated counts
    departments = [
        ("municipal-licensing", "licensing@goveaseai.gov", "License@123"),
        ("department-labour", "labour@goveaseai.gov", "Labour@123"),
        ("directorate-industries", "industry@goveaseai.gov", "Industry@123"),
        ("urban-development", "building@goveaseai.gov", "Building@123"),
        ("inspectorate-factories", "factory@goveaseai.gov", "Factory@123"),
        ("pollution-control", "pollution@goveaseai.gov", "Pollution@123"),
    ]

    print("\n--- CHECKING ALL 6 DEPARTMENTS VIA AUTHENTICATED OFFICER TOKENS ---")
    dept_stats_summary = {}
    for dept_id, email, pwd in departments:
        status, off_auth = api_request("POST", "/auth/officer/login", {
            "department": dept_id,
            "email": email,
            "password": pwd
        })
        assert status == 200, f"Failed to login for {dept_id}: {off_auth}"
        token = off_auth["access_token"]

        status, d_stats = api_request("GET", "/officer/dashboard/stats", token=token)
        status_apps, d_apps = api_request("GET", "/officer/applications", token=token)
        dept_stats_summary[dept_id] = {
            "total": d_stats["total"],
            "apps_count": len(d_apps),
            "stats": d_stats
        }
        print(f"Dept [{dept_id}]: Total={d_stats['total']}, Queue Length={len(d_apps)}, Pending={d_stats['pendingReview']}, Approved={d_stats['approved']}, Rejected={d_stats['rejected']}")
        assert d_stats["total"] == len(d_apps), f"Mismatch in {dept_id}: stats.total={d_stats['total']} vs len(apps)={len(d_apps)}"

    print("\n=== FULL WORKFLOW VERIFICATION SUCCEEDED WITH 100% REAL-TIME POSTGRESQL DATA! ===")

if __name__ == "__main__":
    test_workflow()
