import os

from supabase import create_client, Client


_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        _client = create_client(url, key)
    return _client


def upload_pdf(bucket: str, path: str, file_bytes: bytes) -> None:
    _get_client().storage.from_(bucket).upload(
        path, file_bytes, {"content-type": "application/pdf"}
    )


def get_signed_url(bucket: str, path: str, expires_in: int = 3600) -> str:
    result = _get_client().storage.from_(bucket).create_signed_url(path, expires_in)
    return result["signedURL"]
