import os
from app.db.session import SessionLocal
import app.db.models as models
from app.utils.security import hash_password

def create_initial_admin():
    db = SessionLocal()
    try:
        admin_username = os.getenv("ADMIN_USERNAME", "Admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "5tr0ng(pa55w0rd)")
        if not db.query(models.User).filter(models.User.username == admin_username).first():
            admin = models.User(
                username=admin_username,
                password_hash=hash_password(admin_password),
                role=models.Role.ADMIN
            )
            db.add(admin)
            db.commit()
        else:
            pass
    finally:
        db.close()

if __name__ == "__main__":
    create_initial_admin()
