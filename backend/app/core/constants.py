SUBJECT_TAXONOMY: list[str] = [
    "O-Level Mathematics",
    "O-Level Additional Mathematics",
    "O-Level Physics",
    "O-Level Chemistry",
    "O-Level Biology",
    "O-Level Computer Science",
    "O-Level Economics",
    "O-Level Business Studies",
    "O-Level Accounting",
    "O-Level English Language",
    "O-Level Urdu",
    "O-Level Pakistan Studies",
    "O-Level Islamiyat",
    "A-Level Mathematics",
    "A-Level Further Mathematics",
    "A-Level Physics",
    "A-Level Chemistry",
    "A-Level Biology",
    "A-Level Computer Science",
    "A-Level Economics",
    "A-Level Business Studies",
    "A-Level Accounting",
]

MAX_SUBJECTS = 3

TRANSCRIPT_BUCKET = "transcripts"


def allowed_teaching_levels(cambridge_transcript_level: str) -> set[str]:
    if cambridge_transcript_level == "a_level":
        return {"o_level", "a_level", "both"}
    return {"o_level"}