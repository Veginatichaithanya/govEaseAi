"""
seed_six_officers.py — Seed the 6 statutory government officer accounts into PostgreSQL.
Each officer belongs to one of the 6 official departments:
1. Municipal Licensing Division -> licensing@goveaseai.gov / License@123
2. Department of Labour -> labour@goveaseai.gov / Labour@123
3. Directorate of Industries -> industry@goveaseai.gov / Industry@123
4. Urban Development & Town Planning -> building@goveaseai.gov / Building@123
5. Inspectorate of Factories -> factory@goveaseai.gov / Factory@123
6. Pollution Control Board -> pollution@goveaseai.gov / Pollution@123
"""
import logging
from app.database import SessionLocal
from app.models.user import User
from app.models.officer import Officer
from app.services.auth_service import hash_password

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("goveaseai.seed_six")

SIX_OFFICERS = [
    {
        "id": "OFF-MLD-001",
        "email": "licensing@goveaseai.gov",
        "password": "License@123",
        "full_name": "S. Narayanan",
        "dept_id": "municipal-licensing",
        "dept_name": "Municipal Licensing Division",
        "role": "LICENSING_OFFICER",
        "title": "Senior Licensing Officer",
        "mobile": "+91 99001 10002"
    },
    {
        "id": "OFF-DOL-002",
        "email": "labour@goveaseai.gov",
        "password": "Labour@123",
        "full_name": "P. Ramesh Babu",
        "dept_id": "department-labour",
        "dept_name": "Department of Labour",
        "role": "LABOUR_OFFICER",
        "title": "Labour Enforcement Officer",
        "mobile": "+91 99001 10008"
    },
    {
        "id": "OFF-DOI-003",
        "email": "industry@goveaseai.gov",
        "password": "Industry@123",
        "full_name": "K. Ananya Sharma",
        "dept_id": "directorate-industries",
        "dept_name": "Directorate of Industries",
        "role": "INDUSTRY_OFFICER",
        "title": "Industries Promotion Officer",
        "mobile": "+91 99001 10004"
    },
    {
        "id": "OFF-UDTP-004",
        "email": "building@goveaseai.gov",
        "password": "Building@123",
        "full_name": "M. Venkat Reddy",
        "dept_id": "urban-development",
        "dept_name": "Urban Development & Town Planning",
        "role": "BUILDING_OFFICER",
        "title": "Town Planning Officer",
        "mobile": "+91 99001 10003"
    },
    {
        "id": "OFF-IOF-005",
        "email": "factory@goveaseai.gov",
        "password": "Factory@123",
        "full_name": "G. Harish Chandra",
        "dept_id": "inspectorate-factories",
        "dept_name": "Inspectorate of Factories",
        "role": "FACTORY_OFFICER",
        "title": "Factory Licensing Officer",
        "mobile": "+91 99001 10009"
    },
    {
        "id": "OFF-PCB-006",
        "email": "pollution@goveaseai.gov",
        "password": "Pollution@123",
        "full_name": "Dr. S. Radhika",
        "dept_id": "pollution-control",
        "dept_name": "Pollution Control Board",
        "role": "ENVIRONMENT_OFFICER",
        "title": "Pollution Control Officer",
        "mobile": "+91 99001 10005"
    }
]


def seed_six_officers():
    db = SessionLocal()
    try:
        for o in SIX_OFFICERS:
            h = hash_password(o["password"])
            email = o["email"].lower().strip()

            # 1. Update or create in `users` table
            u = db.query(User).filter(User.email.ilike(email)).first()
            if u:
                u.password_hash = h
                u.full_name = o["full_name"]
                u.department_id = o["dept_id"]
                u.officer_title = o["title"]
                u.role = "OFFICER"
                u.is_active = True
                logger.info(f"Updated user in PostgreSQL: {email}")
            else:
                u = User(
                    id=o["id"],
                    email=email,
                    password_hash=h,
                    full_name=o["full_name"],
                    department_id=o["dept_id"],
                    officer_title=o["title"],
                    role="OFFICER",
                    phone=o["mobile"],
                    applicant_id=f"OFF-{o['id']}",
                    is_active=True
                )
                db.add(u)
                logger.info(f"Created user in PostgreSQL: {email}")

            # 2. Update or create in `officers` table
            off = db.query(Officer).filter(Officer.email.ilike(email)).first()
            if off:
                off.password_hash = h
                off.full_name = o["full_name"]
                off.department = o["dept_name"]
                off.role = o["role"]
                off.designation = o["title"]
                off.mobile = o["mobile"]
                off.is_active = True
                logger.info(f"Updated officer in PostgreSQL: {email}")
            else:
                off = Officer(
                    id=o["id"],
                    email=email,
                    password_hash=h,
                    full_name=o["full_name"],
                    department=o["dept_name"],
                    role=o["role"],
                    designation=o["title"],
                    mobile=o["mobile"],
                    is_active=True
                )
                db.add(off)
                logger.info(f"Created officer in PostgreSQL: {email}")

        db.commit()
        logger.info("All 6 government officer accounts successfully seeded into PostgreSQL.")
    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_six_officers()
