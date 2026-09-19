import requests

BASE_URL = "http://127.0.0.1:5000"

services_data = [
    {
        "service_id": "trade-license",
        "officer_email": "licensing@goveaseai.gov",
        "officer_pass": "License@123",
        "dept_id": "municipal-licensing"
    },
    {
        "service_id": "shop-registration",
        "officer_email": "labour@goveaseai.gov",
        "officer_pass": "Labour@123",
        "dept_id": "department-labour"
    },
    {
        "service_id": "business-license",
        "officer_email": "industry@goveaseai.gov",
        "officer_pass": "Industry@123",
        "dept_id": "directorate-industries"
    },
    {
        "service_id": "building-permission",
        "officer_email": "building@goveaseai.gov",
        "officer_pass": "Building@123",
        "dept_id": "urban-development"
    },
    {
        "service_id": "factory-registration",
        "officer_email": "factory@goveaseai.gov",
        "officer_pass": "Factory@123",
        "dept_id": "inspectorate-factories"
    },
    {
        "service_id": "pollution-certificate",
        "officer_email": "pollution@goveaseai.gov",
        "officer_pass": "Pollution@123",
        "dept_id": "pollution-control"
    }
]

def test_six_services():
    print("=== TESTING ALL 6 SERVICES END-TO-END CREATION & OFFICER ROUTING ===")
    citizen_res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "naga@gmail.com", "password": "Password@123"})
    citizen_token = citizen_res.json()["token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

    all_pass = True
    for item in services_data:
        svc_id = item["service_id"]
        # 1. Create app
        r = requests.post(f"{BASE_URL}/api/applications", headers=citizen_headers, json={
            "serviceId": svc_id,
            "initialFormData": {"applicantName": "Veginati Chaithanya", "service": svc_id}
        })
        if r.status_code != 200:
            print(f"[-] Failed to create app for {svc_id}: {r.status_code} {r.text}")
            all_pass = False
            continue
        app = r.json()
        app_id = app["id"]
        dept_id = app["departmentId"]
        print(f"[+] Service '{svc_id}' created App {app_id} -> Dept: {dept_id}")
        assert dept_id == item["dept_id"], f"Mismatched department {dept_id} vs {item['dept_id']}"

        # 2. Submit app
        r_sub = requests.post(f"{BASE_URL}/api/applications/{app_id}/submit", headers=citizen_headers)
        assert r_sub.status_code == 200, f"Failed submit: {r_sub.text}"
        print(f"    Submitted {app_id} successfully.")

        # 3. Officer login for assigned dept
        r_off = requests.post(f"{BASE_URL}/api/auth/officer/login", json={
            "department": item["dept_id"],
            "email": item["officer_email"],
            "password": item["officer_pass"]
        })
        assert r_off.status_code == 200, f"Officer login failed for {item['dept_id']}: {r_off.text}"
        off_token = r_off.json()["access_token"]
        off_headers = {"Authorization": f"Bearer {off_token}"}

        # 4. Officer queue check
        r_q = requests.get(f"{BASE_URL}/api/officer/applications", headers=off_headers)
        assert r_q.status_code == 200
        q_ids = [a["id"] for a in r_q.json()]
        assert app_id in q_ids, f"Application {app_id} missing from {item['dept_id']} officer queue!"
        print(f"    Verified in {item['dept_id']} queue. Total in queue: {len(q_ids)}")

    print(f"=== ALL 6 SERVICES END-TO-END CREATION & ROUTING: {'PASS' if all_pass else 'FAIL'} ===")
    return all_pass

if __name__ == "__main__":
    success = test_six_services()
    exit(0 if success else 1)
