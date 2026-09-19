"""
seed_officers.py — Create the `officers` table and seed 7 role-based government officer accounts.
Each officer has a unique password. Passwords are bcrypt-hashed into the DB — never stored plaintext.
Run with: python -m app.seed_officers
"""
import logging
from sqlalchemy import inspect

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("goveaseai.seed_officers")

# ── Per-officer credentials ────────────────────────────────────────────────
# Passwords are ONLY present here at seeding time to be hashed into the DB.
# The plaintext values are NEVER returned by the API or stored in any config file.
OFFICER_SEED_DATA = [
    {
        "id": "GOV-ADMIN-001",
        "full_name": "Dr. A. Krishnamurthy",
        "email": "admin@goveaseai.gov",
        "password": "Admin@123",
        "department": "Administration & IT",
        "role": "SUPER_ADMIN",
        "designation": "Chief Digital Officer",
        "mobile": "+91 99001 10001",
    },
    {
        "id": "GOV-LIC-002",
        "full_name": "S. Narayanan",
        "email": "licensing@goveaseai.gov",
        "password": "License@123",
        "department": "Municipal Licensing Division",
        "role": "LICENSING_OFFICER",
        "designation": "Senior Licensing Officer",
        "mobile": "+91 99001 10002",
    },
    {
        "id": "GOV-BLD-003",
        "full_name": "M. Venkat Reddy",
        "email": "building@goveaseai.gov",
        "password": "Building@123",
        "department": "Urban Development & Town Planning",
        "role": "BUILDING_OFFICER",
        "designation": "Town Planning Officer",
        "mobile": "+91 99001 10003",
    },
    {
        "id": "GOV-IND-004",
        "full_name": "K. Ananya Sharma",
        "email": "industry@goveaseai.gov",
        "password": "Industry@123",
        "department": "Directorate of Industries",
        "role": "INDUSTRY_OFFICER",
        "designation": "Industries Promotion Officer",
        "mobile": "+91 99001 10004",
    },
    {
        "id": "GOV-ENV-005",
        "full_name": "Dr. S. Radhika",
        "email": "environment@goveaseai.gov",
        "password": "Environment@123",
        "department": "Pollution Control Board",
        "role": "ENVIRONMENT_OFFICER",
        "designation": "Pollution Control Officer",
        "mobile": "+91 99001 10005",
    },
    {
        "id": "GOV-HLT-006",
        "full_name": "Dr. P. Meenakshi",
        "email": "health@goveaseai.gov",
        "password": "Health@123",
        "department": "Department of Health & Family Welfare",
        "role": "HEALTH_OFFICER",
        "designation": "Health Licensing Officer",
        "mobile": "+91 99001 10006",
    },
    {
        "id": "GOV-REV-007",
        "full_name": "B. Subrahmanyam",
        "email": "revenue@goveaseai.gov",
        "password": "Revenue@123",
        "department": "Revenue & Stamps Department",
        "role": "REVENUE_OFFICER",
        "designation": "Revenue Assessment Officer",
        "mobile": "+91 99001 10007",
    },
]


def seed_officers():
    from app.database import SessionLocal, engine, Base
    from app.models.officer import Officer
    from app.services.auth_service import hash_password

    # Create officers table if it does not exist
    inspector = inspect(engine)
    if "officers" not in inspector.get_table_names():
        logger.info("Creating `officers` table...")
        Base.metadata.create_all(bind=engine, tables=[Officer.__table__])
        logger.info("`officers` table created.")
    else:
        logger.info("`officers` table already exists.")

    db = SessionLocal()
    created = 0
    updated = 0

    try:
        for data in OFFICER_SEED_DATA:
            # Hash each officer's unique password individually
            hashed = hash_password(data["password"])

            existing = db.query(Officer).filter(Officer.email.ilike(data["email"])).first()
            if existing:
                existing.password_hash = hashed
                existing.full_name = data["full_name"]
                existing.department = data["department"]
                existing.role = data["role"]
                existing.designation = data["designation"]
                existing.mobile = data["mobile"]
                existing.is_active = True
                updated += 1
                logger.info(f"  Updated: {data['email']}  [{data['role']}]")
            else:
                officer = Officer(
                    id=data["id"],
                    full_name=data["full_name"],
                    email=data["email"],
                    password_hash=hashed,
                    department=data["department"],
                    role=data["role"],
                    designation=data["designation"],
                    mobile=data["mobile"],
                    is_active=True,
                )
                db.add(officer)
                created += 1
                logger.info(f"  Created: {data['email']}  [{data['role']}]")

        db.commit()
        logger.info(f"Seeding complete — Created: {created}, Updated: {updated}")

    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_officers()
    logger.info("")
    logger.info("Officer accounts in DB:")
    for o in OFFICER_SEED_DATA:
        logger.info(f"  {o['email']:45s}  [{o['role']}]")
