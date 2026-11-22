import sys
import os
import re

# Add Backend to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal, engine
from sqlalchemy import text

def audit_database():
    print("=== PHASE 1 & 3: DATABASE HEALTH & TABLES ===")
    db = SessionLocal()
    try:
        # Test SELECT 1
        res = db.execute(text("SELECT 1;")).scalar()
        print(f"PostgreSQL connection test: SELECT 1 -> {res} (PASS)")
        
        # Get all table names
        tables_res = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)).fetchall()
        table_names = [r[0] for r in tables_res]
        print(f"Tables found ({len(table_names)}):", table_names)

        print("\n=== PHASE 4: EXACT DATABASE COUNTS ===")
        counts = {}
        for tbl in table_names:
            cnt = db.execute(text(f"SELECT COUNT(*) FROM \"{tbl}\";")).scalar()
            counts[tbl] = cnt
            print(f"  Table '{tbl}': {cnt} records")

        # Specific domain counts
        total_users = db.execute(text("SELECT COUNT(*) FROM users;")).scalar()
        citizens = db.execute(text("SELECT COUNT(*) FROM users WHERE UPPER(role) = 'CITIZEN';")).scalar()
        users_officers = db.execute(text("SELECT COUNT(*) FROM users WHERE UPPER(role) = 'OFFICER';")).scalar()
        officers_tbl_cnt = db.execute(text("SELECT COUNT(*) FROM officers;")).scalar()
        departments = db.execute(text("SELECT COUNT(*) FROM government_departments;")).scalar()
        services = db.execute(text("SELECT COUNT(*) FROM government_services;")).scalar()
        applications = db.execute(text("SELECT COUNT(*) FROM applications;")).scalar()
        documents = db.execute(text("SELECT COUNT(*) FROM application_documents;")).scalar()
        notifications = db.execute(text("SELECT COUNT(*) FROM notifications;")).scalar()
        conversations = db.execute(text("SELECT COUNT(*) FROM ai_conversations;")).scalar()
        messages = db.execute(text("SELECT COUNT(*) FROM ai_messages;")).scalar()

        print("\nSpecific Entity Counts:")
        print(f"  Total Users: {total_users}")
        print(f"  Citizens (in users): {citizens}")
        print(f"  Officers (in users): {users_officers}")
        print(f"  Officers (in officers table): {officers_tbl_cnt}")
        print(f"  Departments: {departments}")
        print(f"  Services: {services}")
        print(f"  Applications: {applications}")
        print(f"  Documents: {documents}")
        print(f"  Notifications: {notifications}")
        print(f"  Conversations: {conversations}")
        print(f"  Messages: {messages}")

        print("\n=== PHASE 5: DATABASE INTEGRITY CHECKS ===")
        # 1. Duplicate citizen emails
        dup_emails = db.execute(text("SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;")).fetchall()
        print(f"  Duplicate user emails: {len(dup_emails)}")

        # 2. Duplicate citizen phones
        dup_phones = db.execute(text("SELECT phone, COUNT(*) FROM users WHERE phone IS NOT NULL AND phone != '' GROUP BY phone HAVING COUNT(*) > 1;")).fetchall()
        print(f"  Duplicate user phones: {len(dup_phones)}")

        # 3. Duplicate application numbers
        dup_app_nums = db.execute(text("SELECT application_number, COUNT(*) FROM applications GROUP BY application_number HAVING COUNT(*) > 1;")).fetchall()
        print(f"  Duplicate application numbers: {len(dup_app_nums)}")

        # 4. Orphan applications (citizen_id not in users)
        orphan_apps = db.execute(text("SELECT a.id FROM applications a LEFT JOIN users u ON a.citizen_id = u.id WHERE u.id IS NULL;")).fetchall()
        print(f"  Orphan applications: {len(orphan_apps)}")

        # 5. Orphan documents (application_id not in applications)
        orphan_docs = db.execute(text("SELECT d.id FROM application_documents d LEFT JOIN applications a ON d.application_id = a.id WHERE a.id IS NULL;")).fetchall()
        print(f"  Orphan documents: {len(orphan_docs)}")

        # 6. Orphan notifications (user_id not in users)
        orphan_notifs = db.execute(text("SELECT n.id FROM notifications n LEFT JOIN users u ON n.user_id = u.id WHERE u.id IS NULL;")).fetchall()
        print(f"  Orphan notifications: {len(orphan_notifs)}")

        # 7. Orphan conversations (user_id not in users)
        orphan_convs = db.execute(text("SELECT c.id FROM ai_conversations c LEFT JOIN users u ON c.user_id = u.id WHERE u.id IS NULL;")).fetchall()
        print(f"  Orphan conversations: {len(orphan_convs)}")

        # 8. Orphan messages (conversation_id not in ai_conversations)
        orphan_msgs = db.execute(text("SELECT m.id FROM ai_messages m LEFT JOIN ai_conversations c ON m.conversation_id = c.id WHERE c.id IS NULL;")).fetchall()
        print(f"  Orphan messages: {len(orphan_msgs)}")

        # 9. Invalid service mappings (services with department_id not in government_departments)
        invalid_svc_dept = db.execute(text("SELECT s.id, s.name, s.department_id FROM government_services s LEFT JOIN government_departments d ON s.department_id = d.id WHERE d.id IS NULL;")).fetchall()
        print(f"  Invalid service->department mappings: {len(invalid_svc_dept)}")

        # 10. Invalid application service mappings (applications with service_id not in government_services)
        invalid_app_svc = db.execute(text("SELECT a.id, a.service_id FROM applications a LEFT JOIN government_services s ON a.service_id = s.id WHERE s.id IS NULL;")).fetchall()
        print(f"  Invalid application->service mappings: {len(invalid_app_svc)}")

        # 11. Verify all 6 services and their departments
        print("\n=== PHASE 15: SERVICE TO DEPARTMENT MAPPING ===")
        svcs = db.execute(text("""
            SELECT s.id, s.name, d.id AS dept_id, d.name AS dept_name 
            FROM government_services s 
            JOIN government_departments d ON s.department_id = d.id 
            ORDER BY s.name;
        """)).fetchall()
        for s in svcs:
            print(f"  Service: '{s.name}' ({s.id}) -> Department: '{s.dept_name}' ({s.dept_id})")

        # 12. Check officers in officers table
        print("\n=== PHASE 30: OFFICERS IN DATABASE ===")
        officers_list = db.execute(text("""
            SELECT id, full_name, email, role, department, designation, is_active
            FROM officers
            ORDER BY department;
        """)).fetchall()
        for off in officers_list:
            print(f"  Officer: {off.full_name} | Email: {off.email} | Role: {off.role} | Dept: {off.department} | Desig: {off.designation}")

        # Also check officers in users table
        print("\n=== USERS WITH OFFICER ROLE ===")
        users_off_list = db.execute(text("""
            SELECT u.id, u.full_name, u.email, u.role, u.department_id, d.name AS dept_name
            FROM users u
            LEFT JOIN government_departments d ON u.department_id = d.id
            WHERE UPPER(u.role) = 'OFFICER'
            ORDER BY d.name;
        """)).fetchall()
        for uo in users_off_list:
            print(f"  User Officer: {uo.full_name} | Email: {uo.email} | Dept: {uo.dept_name}")

    finally:
        db.close()

if __name__ == "__main__":
    audit_database()
