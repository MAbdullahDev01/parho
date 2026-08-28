import uuid
from datetime import datetime, timezone

from app.core.constants import TRANSCRIPT_BUCKET
from app.db.supabase import get_supabase
from app.schemas.tutor import TranscriptRecord, TranscriptType

ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB

# Upload a transcript file to the private `transcripts` bucket and return a TranscriptRecord
def upload_transcript(
    clerk_id: str,
    transcript_type: TranscriptType,
    filename: str,
    content_type: str,
    file_bytes: bytes,
) -> TranscriptRecord:
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(f"Unsupported file type: {content_type}. Use PDF, JPEG, or PNG.")

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise ValueError("File exceeds the 10MB limit.")

    extension = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    storage_path = f"{clerk_id}/{transcript_type}-{uuid.uuid4().hex}.{extension}"

    supabase = get_supabase()
    supabase.storage.from_(TRANSCRIPT_BUCKET).upload(
        storage_path,
        file_bytes,
        {"content-type": content_type},
    )

    return TranscriptRecord(
        storage_path=storage_path,
        original_filename=filename,
        transcript_type=transcript_type,
        uploaded_at=datetime.now(timezone.utc),
    )