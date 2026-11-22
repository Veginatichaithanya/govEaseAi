import re
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.application import Application

def generate_next_application_number(db: Session) -> str:
    """
    Generate unique sequential application number (e.g. GEAI-2026-000001).
    Queries the database for existing numbers to avoid collisions.
    """
    regex = r"GEAI-2026-(\d+)"
    # Query all current application IDs matching the pattern
    apps = db.query(Application.application_number).filter(
        Application.application_number.like("GEAI-2026-%")
    ).all()

    max_num = 0
    for (app_num,) in apps:
        match = re.search(regex, app_num)
        if match:
            try:
                num = int(match.group(1))
                if num > max_num:
                    max_num = num
            except ValueError:
                pass

    next_num = max_num + 1
    return f"GEAI-2026-{str(next_num).zfill(6)}"
