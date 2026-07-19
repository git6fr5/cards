import os

from sqlalchemy.orm import Session

from accounts.orm.organisation import Organisation
from accounts.orm.user import User
from utils.encryption import hash_password


USER_SEEDS = [
    ("player_one@example.com", "Player One"),
    ("player_two@example.com", "Player Two"),
]


def seed_password() -> str:
    return os.getenv("SEED_PASSWORD", "password123")


def seed_user(session: Session, organisation: Organisation) -> list[User]:
    password = seed_password()
    users = [
        User(
            email=email,
            password_hash=hash_password(password),
            display_name=display_name,
            organisation_id=organisation.id,
        )
        for email, display_name in USER_SEEDS
    ]
    session.add_all(users)
    session.flush()
    return users
