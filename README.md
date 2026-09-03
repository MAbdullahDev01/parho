# Parho

Parho is a tutoring marketplace for Cambridge O-Level and A-Level students. It helps students find tutors whose academic background has been reviewed, try a free demo session, communicate about a booking, and manage session payments. Tutors can build a teaching profile, submit transcripts, publish availability, and manage demo requests. Administrators review tutor verification submissions before profiles appear in discovery.

The repository is a full-stack monorepo with a Next.js frontend and a FastAPI backend, backed by Supabase.

## What Parho Already Has

### For students

- Sign up and sign in through Clerk.
- Choose a student or tutor role during onboarding.
- Search verified tutors by subject, Cambridge level, and minimum rating.
- View a tutor profile with subjects, teaching level, rating, bio, and hourly rate.
- View tutor availability and request a free 30-minute demo.
- Track pending, confirmed, and completed bookings.
- Message a tutor in a booking-specific conversation.
- Add funds to a PKR wallet through Safepay.
- View available balance, held funds, and wallet transactions.

### For tutors

- Complete a four-step setup flow:
  1. Select up to three subjects.
  2. Upload an official Cambridge transcript and optional supporting transcripts.
  3. Select the level to teach.
  4. Review and submit the profile.
- Upload PDF, JPEG, and PNG transcript files up to 10 MB each.
- Maintain weekly availability windows.
- Review, confirm, or decline demo requests.
- View students and booking history.
- Message students after a booking is confirmed.
- Mark eligible completed sessions as complete.

### For administrators

- View the tutor verification queue.
- Open tutor profiles and private transcript files through signed URLs.
- Review transcript submissions and make the final approve or reject decision.
- See optional automated screening results, including risk score, flags, and summary.

## How The Main Flow Works

1. A user authenticates with Clerk and selects a role.
2. A tutor submits subjects, teaching level, and transcript files.
3. Transcript files are stored in a private Supabase Storage bucket.
4. An administrator reviews the submission and decides whether the tutor is verified.
5. Students search only the public profiles returned by the verified tutor discovery service.
6. A student selects an available time and requests a 30-minute demo.
7. The tutor confirms or declines the request.
8. Confirmed booking participants can use the booking-scoped message thread.
9. Wallet and Safepay payment primitives support deposits, payment intents, holds, and releases around paid sessions.

Automated transcript screening is advisory. It identifies observable inconsistencies that may warrant human review; it does not establish document authenticity and cannot approve or reject a tutor.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 through PostCSS, shared design tokens |
| UI and motion | Lucide React, class-variance-authority, Motion |
| Authentication | Clerk, including signed webhooks and role metadata |
| Backend API | FastAPI, Uvicorn, Pydantic 2, pydantic-settings |
| Database | Supabase Postgres with SQL migrations, RLS policies, triggers, and RPC functions |
| File storage | Supabase private Storage bucket with signed transcript URLs |
| Payments | Safepay checkout, wallet deposits, payment intents, and signed webhooks |
| Optional automation | OpenAI Responses API for advisory transcript screening |
| Deployment | Vercel monorepo configuration in `vercel.json` |

## Repository Layout

```text
.
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers and webhooks
│   │   ├── core/         # Settings, security, constants, error handling
│   │   ├── db/           # Supabase client
│   │   ├── schemas/      # Pydantic request and response models
│   │   └── services/     # Domain logic for users, tutors, bookings, etc.
│   ├── supabase/migrations/ # Postgres schema and database functions
│   └── requirements.txt
├── frontend/
│   ├── app/              # Next.js routes, dashboards, server actions
│   ├── components/       # Shared authentication, dashboard, landing, and UI components
│   ├── lib/              # Styling, motion, Clerk appearance, and static content
│   └── package.json
├── vercel.json           # Frontend/backend service routing for Vercel
└── LICENSE               # GNU Affero General Public License v3
```

## Application Areas

The frontend currently includes:

- `/` for the public landing page.
- `/sign-in`, `/sign-up`, and `/sign-out` for authentication.
- `/onboarding` for role selection.
- `/onboarding/tutor-setup` for tutor profile and transcript submission.
- `/dashboard/student` for student activity, tutor discovery, bookings, messages, and wallet.
- `/dashboard/tutor` for tutor activity, availability, students, bookings, and messages.
- `/dashboard/admin` for tutor verification review.

The FastAPI application is mounted from `backend/app/main.py` and exposes grouped routes for:

- Users and Clerk webhooks.
- Tutor profiles and transcript uploads.
- Verified tutor discovery.
- Availability and booking lifecycle management.
- Booking-scoped messages.
- Wallet operations and payment flows.
- Admin verification review.
- Safepay webhooks.

## Database Model

The migrations in `backend/supabase/migrations/` add or extend:

- `student_profiles`
- `tutor_profiles` verification and automated-screening fields
- `tutor_availability`
- `bookings`
- `messages`
- `wallet_accounts`
- `wallet_transactions`
- `payment_intents`

They also define indexes, row-level security policies, timestamps, booking creation logic, and wallet RPC functions for deposits, payment holds, and payment releases. The migration set expects the foundational user and tutor tables to already exist in the Supabase project.

## Local Development

### Prerequisites

- Node.js and npm
- Python 3.12
- A Supabase project
- A Clerk application
- Safepay credentials for payment testing
- An OpenAI API key only if automated transcript screening is enabled

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend development server normally runs at `http://localhost:3000`.

Other frontend commands:

```bash
npm run lint
npm run build
npm run start
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend exposes `GET /health`, which returns `{ "status": "ok" }` when the API is running.

### Environment configuration

Copy the required values into the appropriate local environment files. Do not commit credentials.

Frontend values used by the repository include:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL
BACKEND_INTERNAL_URL
BACKEND_INTERNAL_SECRET
```

Backend values include:

```text
CLERK_WEBHOOK_SIGNING_SECRET
CLERK_WEBHOOK_SIGNING_SECRET_TESTING
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
INTERNAL_API_SECRET
SAFE_PAY_ENV
SAFE_PAY_SECRET_KEY
SAFE_PAY_PUBLIC_KEY
SAFE_PAY_WEBHOOK_SECRET
OPENAI_API_KEY
OPENAI_AUTO_VERIFICATION_MODEL
AUTO_VERIFICATION_ENABLED
AUTO_VERIFICATION_FLAG_THRESHOLD
```

The backend reads `.env` through `pydantic-settings`. The frontend uses its Next.js environment configuration, and Vercel connects the two services through `BACKEND_INTERNAL_URL`.

## Deployment

`vercel.json` defines two Vercel services:

- `frontend`: the Next.js application under `frontend/`.
- `backend`: the FastAPI application under `backend/`, with entry point `app.main:app`.

Requests under `/api/backend/*` are routed to the backend service; other requests are routed to the frontend. Configure all Clerk, Supabase, Safepay, internal API, and optional OpenAI variables in the deployment environment before enabling production traffic.

## Current Status And Boundaries

Parho is an active implementation rather than a finished production platform. In particular:

- The migration set does not include every foundational table; apply it to a correctly initialized Supabase project.
- Automated transcript screening is optional and disabled by default.
- Safepay, wallet escrow, and payment-intent backend flows exist, but the end-to-end paid-session experience should be verified against the current product workflow before launch.
- Refund event recording is present, while automatic refund reversal is intentionally not implemented in the Safepay webhook handler.
- Tutor withdrawals and payout-provider integrations are not currently exposed as a complete frontend workflow.
- The repository does not currently contain a backend test suite or a dedicated test command.
- Landing-page tutor cards and FAQ content are static presentation data; marketplace discovery uses the backend-backed tutor search flow.

## License

Parho is licensed under the GNU Affero General Public License v3. See [LICENSE](LICENSE) for the complete terms.