"""
cleanup_database.py — Safe database cleanup script for GovEaseAI.
Preserves:
  - Citizen: Veginati Chaithanya (id: 56c093eb-6fb9-4d11-83b3-474ab2cef3a4)
  - All 12 government officers
  - All 6 government departments
  - All 6 government services
Removes:
  - 22 test/demo citizen accounts and their dependent records (applications, documents, activity, analyses, notifications, conversations, messages).
"""
import os
import json
import logging
from datetime import datetime, timezone

from app.database import SessionLocal, engine
from app.models.user import User
from app.models.profile import CitizenProfile
from app.models.department import GovernmentDepartment
from app.models.service import GovernmentService
from app.models.application import Application
from app.models.document import ApplicationDocument
from app.models.activity import ApplicationActivity
from app.models.notification import Notification
from app.models.ai_chat import AIConversation, AIMessage
from app.models.ai_analysis import AIAnalysis

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("goveaseai.cleanup")

TARGET_CITIZEN_ID = "56c093eb-6fb9-4d11-83b3-474ab2cef3a4"

def run_cleanup():
    db = SessionLocal()
    try:
        logger.info("=== STEP 1: VERIFY TARGET CITIZEN AND GATHER COUNTS ===")
        target_citizen = db.query(User).filter(User.id == TARGET_CITIZEN_ID).first()
        if not target_citizen:
            raise ValueError(f"Target citizen with ID '{TARGET_CITIZEN_ID}' not found in database! Aborting.")
        
        logger.info(f"Target Citizen Found: {target_citizen.full_name} ({target_citizen.email}, {target_citizen.phone})")
        # Format name properly to title case
        target_citizen.full_name = "Veginati Chaithanya"
        db.flush()

        all_citizens = db.query(User).filter(User.role == "CITIZEN").all()
        other_citizen_ids = [u.id for u in all_citizens if u.id != TARGET_CITIZEN_ID]
        logger.info(f"Total citizens before: {len(all_citizens)}")
        logger.info(f"Other citizens to remove: {len(other_citizen_ids)}")

        # Check applications
        target_apps = db.query(Application).filter(Application.citizen_id == TARGET_CITIZEN_ID).all()
        target_app_ids = [a.id for a in target_apps]
        other_apps = db.query(Application).filter(Application.citizen_id.in_(other_citizen_ids)).all()
        other_app_ids = [a.id for a in other_apps]

        logger.info(f"Target citizen applications: {len(target_app_ids)}")
        logger.info(f"Other demo applications to remove: {len(other_app_ids)}")

        # Step 2: Backup to scratch directory
        logger.info("=== STEP 2: CREATING SAFETY BACKUP ===")
        scratch_dir = os.path.join(os.path.dirname(__file__), "..", "scratch")
        os.makedirs(scratch_dir, exist_ok=True)
        backup_file = os.path.join(scratch_dir, "backup_before_cleanup.json")

        backup_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "target_citizen": {
                "id": target_citizen.id,
                "full_name": target_citizen.full_name,
                "email": target_citizen.email,
                "phone": target_citizen.phone,
                "applicant_id": target_citizen.applicant_id,
            },
            "deleted_citizen_ids": other_citizen_ids,
            "deleted_application_ids": other_app_ids,
        }
        with open(backup_file, "w", encoding="utf-8") as f:
            json.dump(backup_data, f, indent=2)
        logger.info(f"Safety backup saved to: {backup_file}")

        # Step 3: Deleting dependent records of other citizens in safe foreign-key order
        logger.info("=== STEP 3: SAFELY REMOVING OTHER CITIZEN DEPENDENT RECORDS ===")

        # 3.1 AI Messages for other citizens' conversations
        other_convs = db.query(AIConversation).filter(AIConversation.user_id.in_(other_citizen_ids)).all()
        other_conv_ids = [c.id for c in other_convs]
        if other_conv_ids:
            del_msgs = db.query(AIMessage).filter(AIMessage.conversation_id.in_(other_conv_ids)).delete(synchronize_session=False)
            logger.info(f"Deleted AIMessages: {del_msgs}")

        # 3.2 AI Conversations for other citizens
        if other_conv_ids:
            del_convs = db.query(AIConversation).filter(AIConversation.id.in_(other_conv_ids)).delete(synchronize_session=False)
            logger.info(f"Deleted AIConversations: {del_convs}")

        # 3.3 AI Analysis for other citizens or their applications
        del_analyses = db.query(AIAnalysis).filter(
            (AIAnalysis.user_id.in_(other_citizen_ids)) | (AIAnalysis.application_id.in_(other_app_ids))
        ).delete(synchronize_session=False)
        logger.info(f"Deleted AIAnalysis records: {del_analyses}")

        # 3.4 Application Activity for other applications or actors
        del_acts = db.query(ApplicationActivity).filter(
            (ApplicationActivity.application_id.in_(other_app_ids)) | (ApplicationActivity.actor_user_id.in_(other_citizen_ids))
        ).delete(synchronize_session=False)
        logger.info(f"Deleted ApplicationActivity records: {del_acts}")

        # 3.5 Application Documents for other applications
        if other_app_ids:
            del_docs = db.query(ApplicationDocument).filter(ApplicationDocument.application_id.in_(other_app_ids)).delete(synchronize_session=False)
            logger.info(f"Deleted ApplicationDocument records: {del_docs}")

        # 3.6 Notifications for other citizens
        del_notifs = db.query(Notification).filter(Notification.user_id.in_(other_citizen_ids)).delete(synchronize_session=False)
        logger.info(f"Deleted Notifications: {del_notifs}")

        # 3.7 Applications of other citizens
        if other_app_ids:
            del_apps = db.query(Application).filter(Application.id.in_(other_app_ids)).delete(synchronize_session=False)
            logger.info(f"Deleted Applications: {del_apps}")

        # 3.8 Citizen Profiles for other citizens
        del_profiles = db.query(CitizenProfile).filter(CitizenProfile.user_id.in_(other_citizen_ids)).delete(synchronize_session=False)
        logger.info(f"Deleted CitizenProfiles: {del_profiles}")

        # 3.9 Other Citizen User records
        del_users = db.query(User).filter(User.id.in_(other_citizen_ids)).delete(synchronize_session=False)
        logger.info(f"Deleted Citizen Users: {del_users}")

        db.commit()
        logger.info("=== DATABASE COMMIT SUCCESSFUL ===")

        # Step 4: Verification Queries
        logger.info("=== STEP 4: VERIFY POST-CLEANUP DATABASE COUNTS ===")
        citizens_after = db.query(User).filter(User.role == "CITIZEN").all()
        officers_after = db.query(User).filter(User.role == "OFFICER").all()
        depts_after = db.query(GovernmentDepartment).all()
        services_after = db.query(GovernmentService).all()
        apps_after = db.query(Application).all()
        target_citizen_after = db.query(User).filter(User.id == TARGET_CITIZEN_ID).first()

        logger.info(f"Citizens: {len(citizens_after)} (Expected: 1)")
        logger.info(f"Officers: {len(officers_after)} (Expected: 12)")
        logger.info(f"Departments: {len(depts_after)} (Expected: 6)")
        logger.info(f"Services: {len(services_after)} (Expected: 6)")
        logger.info(f"Remaining applications: {len(apps_after)}")
        logger.info(f"Veginati Chaithanya preserved: {target_citizen_after is not None}")
        if target_citizen_after:
            logger.info(f"  Name: {target_citizen_after.full_name}, Email: {target_citizen_after.email}, ApplicantID: {target_citizen_after.applicant_id}")

        assert len(citizens_after) == 1, f"Expected 1 citizen, found {len(citizens_after)}"
        assert len(officers_after) == 12, f"Expected 12 officers, found {len(officers_after)}"
        assert len(depts_after) == 6, f"Expected 6 departments, found {len(depts_after)}"
        assert len(services_after) == 6, f"Expected 6 services, found {len(services_after)}"
        assert target_citizen_after.full_name == "Veginati Chaithanya"

        print("\n" + "="*50)
        print("DATABASE CLEANUP REPORT:")
        print(f"Citizens before: {len(all_citizens)}")
        print(f"Citizens after: {len(citizens_after)}")
        print(f"Veginati Chaithanya: PRESERVED (Name: {target_citizen_after.full_name})")
        print(f"Other test citizens REMOVED: {del_users}")
        print(f"Officers: {len(officers_after)}")
        print(f"Departments: {len(depts_after)}")
        print(f"Services: {len(services_after)}")
        print(f"Applications remaining: {len(apps_after)}")
        print("="*50)

    except Exception as e:
        db.rollback()
        logger.error(f"Cleanup failed with error: {e}", exc_info=True)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_cleanup()
