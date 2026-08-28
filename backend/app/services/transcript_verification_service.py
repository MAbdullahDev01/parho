import base64
import json
from datetime import datetime, timezone
from typing import Any

from openai import OpenAI

from app.core.config import settings
from app.core.constants import TRANSCRIPT_BUCKET
from app.db.supabase import get_supabase


AUTO_VERIFICATION_PROMPT = """
You are reviewing an academic transcript for a tutoring marketplace.

This is NOT a request to prove that a document is authentic. You cannot establish authenticity from an image or PDF alone. Your job is to identify observable inconsistencies or signs that warrant human review.

Review the document for:
- whether it appears to be an academic transcript and whether the stated Cambridge/O-Level/A-Level context is internally coherent;
- visible edits, pasted regions, inconsistent typography, alignment, spacing, compression, or other document-manipulation indicators;
- inconsistent grade formats, totals, dates, candidate information, or school/exam-board terminology;
- missing or unusual official-looking identifiers or formatting, but do not treat absence alone as proof of fabrication;
- contradictions between the claimed Cambridge level and what the document visibly says.

Do not infer fraud from nationality, school prestige, handwriting, image quality alone, or any other irrelevant characteristic.
Do not make a final verification decision. Be conservative: uncertainty should be flagged for human review rather than treated as proof of fabrication.

Return ONLY valid JSON matching this shape:
{
"risk_score": 0,
"verdict": "pass",
"flags": [
    {
    "code": "string",
    "severity": "low|medium|high",
    "evidence": "short observable explanation"
    }
],
"summary": "short explanation"
}

risk_score is 0-100, where higher means more reasons for a human reviewer to inspect the document.
Use verdict "flag" when there is a meaningful reason for manual review; otherwise use "pass".
"""

# Decode the result of the automated verification
def _decode_result(text: str) -> dict[str, Any]:
    try:
        result = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError("Automated verification returned invalid JSON.") from exc

    score = result.get("risk_score")
    verdict = result.get("verdict")
    flags = result.get("flags")
    summary = result.get("summary")

    if not isinstance(score, (int, float)) or not 0 <= score <= 100:
        raise ValueError("Automated verification returned an invalid risk score.")
    if verdict not in {"pass", "flag"}:
        raise ValueError("Automated verification returned an invalid verdict.")
    if not isinstance(flags, list):
        raise ValueError("Automated verification returned invalid flags.")
    if not isinstance(summary, str):
        raise ValueError("Automated verification returned an invalid summary.")

    return {
        "risk_score": round(float(score), 2),
        "verdict": verdict,
        "flags": flags[:20],
        "summary": summary[:2000],
    }

# Build the file input for the automated verification request
def _build_file_input(file_bytes: bytes, filename: str) -> dict[str, str]:
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    mime = {
        "pdf": "application/pdf",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
    }.get(extension)

    if not mime:
        raise ValueError("Unsupported transcript type for automated verification.")

    encoded = base64.b64encode(file_bytes).decode("ascii")

    if mime == "application/pdf":
        return {
            "type": "input_file",
            "filename": filename,
            "file_data": f"data:{mime};base64,{encoded}",
        }

    return {
        "type": "input_image",
        "image_url": f"data:{mime};base64,{encoded}",
        "detail": "high",
    }

# Screen a single transcript document using the automated verification model
def _screen_document(
    file_bytes: bytes,
    filename: str,
    claimed_level: str,
    teaching_level: str,
) -> dict[str, Any]:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    prompt = (
        f"Claimed Cambridge transcript level: {claimed_level}.\n"
        f"Claimed teaching level: {teaching_level}.\n\n"
        "Assess only the attached document."
    )

    response = client.responses.create(
        model=settings.OPENAI_AUTO_VERIFICATION_MODEL,
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": AUTO_VERIFICATION_PROMPT + "\n" + prompt},
                    _build_file_input(file_bytes, filename),
                ],
            }
        ],
    )

    return _decode_result(response.output_text)

# Run the automated verification on a tutor's transcripts and persist the results
def run_auto_verification(
    clerk_id: str,
    transcripts: list[dict[str, Any]],
    claimed_level: str,
    teaching_level: str,
) -> None:
    """Run advisory screening and persist the result without changing admin verification."""
    if not settings.AUTO_VERIFICATION_ENABLED:
        return

    supabase = get_supabase()

    supabase.table("tutor_profiles").update(
        {"auto_verification_status": "running"}
    ).eq("clerk_id", clerk_id).execute()

    all_flags: list[dict[str, Any]] = []
    highest_score = 0.0
    summaries: list[str] = []

    try:
        for transcript in transcripts:
            path = transcript.get("storage_path")
            filename = transcript.get("original_filename") or "transcript"
            if not path:
                continue

            file_bytes = supabase.storage.from_(TRANSCRIPT_BUCKET).download(path)
            result = _screen_document(
                file_bytes=file_bytes,
                filename=filename,
                claimed_level=claimed_level,
                teaching_level=teaching_level,
            )

            highest_score = max(highest_score, float(result["risk_score"]))
            summaries.append(f"{filename}: {result['summary']}")

            for flag in result["flags"]:
                if isinstance(flag, dict):
                    all_flags.append({"filename": filename, **flag})

        auto_status = "flagged" if highest_score >= settings.AUTO_VERIFICATION_FLAG_THRESHOLD or all_flags else "passed"

        supabase.table("tutor_profiles").update(
            {
                "auto_verification_status": auto_status,
                "auto_verification_score": highest_score,
                "auto_verification_flags": all_flags[:50],
                "auto_verification_summary": "\n".join(summaries)[:5000],
                "auto_verified_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("clerk_id", clerk_id).execute()
    except Exception as exc:
        supabase.table("tutor_profiles").update(
            {
                "auto_verification_status": "error",
                "auto_verification_summary": f"Automated screening failed: {str(exc)[:1000]}",
                "auto_verified_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("clerk_id", clerk_id).execute()