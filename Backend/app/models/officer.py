from sqlalchemy import Column, String, Boolean, DateTime, func
from app.database import Base


class Officer(Base):
    """
    Government Officer table — stores all 7 role-based government accounts.
    Separate from the citizen `users` table for clean role separation.
    """
    __tablename__ = "officers"

    id = Column(String(64), primary_key=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

    # e.g. "Administration", "Municipal Licensing", "Urban Development", etc.
    department = Column(String(255), nullable=True)

    # One of: SUPER_ADMIN | LICENSING_OFFICER | BUILDING_OFFICER |
    #         INDUSTRY_OFFICER | ENVIRONMENT_OFFICER | HEALTH_OFFICER | REVENUE_OFFICER
    role = Column(String(64), nullable=False)

    # Human-readable title, e.g. "Senior Licensing Officer"
    designation = Column(String(255), nullable=True)

    mobile = Column(String(32), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
