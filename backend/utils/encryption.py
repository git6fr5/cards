import hashlib

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError


def hash_token(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


_password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False

if __name__=="__main__":
    import sys
    print(hash_password(sys.argv[1]))