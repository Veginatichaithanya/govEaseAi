import uuid
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.user import User
from app.models.profile import CitizenProfile

def backfill_citizen_profiles():
    db = SessionLocal()
    try:
        citizens = db.query(User).filter(User.role == "CITIZEN").all()
        created_count = 0
        for citizen in citizens:
            existing = db.query(CitizenProfile).filter(CitizenProfile.user_id == citizen.id).first()
            if not existing:
                profile = CitizenProfile(
                    id=str(uuid.uuid4()),
                    user_id=citizen.id,
                    preferred_language="English",
                    notification_preferences="Email and SMS"
                )
                db.add(profile)
                created_count += 1
        
        db.commit()
        print(f"Successfully backfilled {created_count} citizen profiles for {len(citizens)} citizens.")
    except Exception as e:
        db.rollback()
        print(f"Error backfilling citizen profiles: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    backfill_citizen_profiles()
