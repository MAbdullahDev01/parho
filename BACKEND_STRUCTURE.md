```text
Backend
├─ app/
│  ├─ api/
│  │  ├─ admin/
│  │  │  ├─ __init__.py
│  │  │  └─ [route.py](backend/app/api/admin/route.py)  <!-- Handles fetching from and sending data to db for /dashboard/admin/* -->
│  │  ├─ tutors/
│  │  │  ├─ __init__.py
│  │  │  └─ [route.py](backend/app/api/tutors/route.py)  <!-- Handles fetching from and sending data to db for /dashboard/tutor/* -->
│  │  ├─ users/
│  │  │  ├─ __init__.py
│  │  │  └─ [route.py](backend/app/api/users/route.py)y  <!-- Handles updating user role -->
│  │  ├─ Webhooks/
│  │  │  ├─ __init__.py
│  │  │  ├─ [clerk.py](backend/app/api/webhooks/clerk.py)  <!-- Handles incoming webhooks from clerk -->
│  │  │  └─ [route.py](backend/app/api/webhooks/route.py)  <!-- Adds webhooks to main routes -->
│  │  └─ [dependencies.py](backend/app/api/dependencies.py)  <!-- Checks to see if incoming requests contain the same secret as the backend -->
│  ├─ core/
│  │  ├─ [config.py](backend/app/core/config.py)  <!-- Imports env variables from .env and stores other configurations -->
│  │  ├─ [constants.py](backend/app/core/constants.py)  <!-- Stores constants used throughout the backend -->
│  │  └─ [security.py](backend/app/core/security.py)  <!-- Verifies incoming clerk webhooks -->
│  ├─ db/
│  │  └─ [supabase.py](backend/app/db/supabase.py)  <!-- Creates a db client that is cached -->
│  ├─ schemas/
│  │  ├─ [admin.py](backend/app/schemas/admin.py)  <!-- Schemas related to tutor verification by admin -->
│  │  ├─ [clerk.py](backend/app/schemas/clerk.py)  <!-- Schema to represent the structure of clerk webhooks -->
│  │  ├─ [tutor.py](backend/app/schemas/tutor.py)  <!-- Schemas related to tutor transcripts and data -->
│  │  └─ [user.py](backend/app/schemas/user.py)  <!-- Schema for setting user role in clerk -->
│  ├─ services/
│  │  ├─ [admin_service.py](backend/app/services/admin_service.py)  <!-- Services that help fetch and arrange tutor data into admin dashboard -->
│  │  ├─ [storage_service.py](backend/app/services/storage_service.py)  <!-- Service to store tutor uploaded transcripts to supabase bucket -->
│  │  ├─ [transcript_verification_service.py](backend/app/services/transcript_verification_service.py)  <!-- Service to auto verify transcripts -->
│  │  ├─ [tutor_service.py](backend/app/services/tutor_service.py)  <!-- Service to update tutor profile -->
│  │  └─ [user_service.py](backend/app/services/user_service.py)  <!-- Service to create and update users -->
│  ├─ __init__.py
│  └─ [main.py](backend/app/main.py) <!-- The entry point for backend -->
├─ supabase/
│  ├─ migrations/
│  │  ├─ [20260824_add_auto_verification.sql](backend/supabase/migrations/20260824_add_auto_verification.sql)
│  │  └─ [20260825_add_verification_decided_by.sql](20260825_add_verification_decided_by.sql)
├─ venv/
├─ __init__.py
├─ .env
├─ .python-version
└─ requirements.txt
```