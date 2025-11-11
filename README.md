# AI Daily Planner

Daily planning agent that helps unemployed professionals stay focused on their primary goal—landing a job—by organizing their tasks and proposing productive learning opportunities.

## Core Experience

- **Ultimate goal banner** persists across the product and anchors all planning decisions.
- **Morning brief** (email + optional web view) outlines the day: carried-forward to-dos, estimated time, and 2–3 curated learning opportunities sized to the user’s available hours.
- **Evening capture** accepts tomorrow’s plan via Remarkable PDF upload or manual entry, plus an “extra learning time” input.

### Daily Flow
| Phase | Inputs | Outputs |
| --- | --- | --- |
| Morning | Stored goal + parsed to-dos + available time + learning history | Daily Brief email/web view |
| Throughout Day | Inline edits, new tasks, completion status | Updated task state persisted |
| Evening | PDF upload or manual text + time availability | Confirmation and queued parsing |

## MVP Feature Breakdown

1. **PDF Processing**
   - Dedicated inbox listener saves Remarkable PDFs.
   - OCR/text extraction converts pages into raw text.
   - Task parser segments bullet/numbered lists into structured to-dos with optional durations.
   - Fallback manual entry flow when parsing confidence is low.

2. **Daily Brief Generation**
   - Goal statement at top with quick edit option.
   - To-do list with checkboxes, inline add/edit, carry-forward rules.
   - Estimated time per task (user-provided or AI estimate) plus total day load.
   - Learning section with relevance blurb, activity type, and time estimate.

3. **To-Do Management**
   - CRUD for tasks, completion tracking, and auto-migration of unfinished tasks.
   - Activity log for future personalization (e.g., most-deferred tasks).

4. **Learning Recommendations**
   - Inputs: goal, target role/industry, stated skills gap, available hours, recent activity, curated job market feeds.
   - Content mix enforced (article/video/exercise/networking).
   - Output capped at available time budget and rotated for freshness.

5. **Onboarding**
   - Collects goal statement, target job title/industry, optional skills gap, typical learning availability, notification preference.

## Technical Architecture

### Committed Stack Decisions

- **Backend:** FastAPI (Python 3.11) with Pydantic v2 and SQLAlchemy 2.x; orchestrated via Poetry for dependency management and scripts.
- **Database:** Postgres in production; SQLite for local development. Alembic will manage migrations.
- **Task queue / scheduled jobs:** APScheduler inside the FastAPI process for MVP (revisit with Celery/Temporal later).
- **Infrastructure:** Start with Docker Compose (FastAPI + Postgres). Future-ready for deployment on Fly.io or Railway.
- **Frontend:** Lightweight React (Vite) dashboard served separately; not yet scaffolded.
- **Email delivery:** Resend API for transactional briefs.

```
Email Listener ─┐
                ├── PDF Processor ── Task Parser ─┐
Manual Entry ───┘                                 │
                                                 ▼
                                            Task Store
                                                 │
User Profile API ──────────────┐                 │
Learning Content Pipelines ────┴──▶ Recommendation Engine
                                                 │
                               Brief Generator ──┴──▶ Email + Web UI
```

### Key Components

| Layer | Technology | Notes |
| --- | --- | --- |
| Email ingestion | Gmail API webhook or AWS SES inbound | Stores PDFs + metadata in object storage (S3/Supabase) |
| PDF/OCR | `pypdf` + Tesseract/AWS Textract | Structured output with confidence scoring |
| Backend | FastAPI / Node (NestJS) | Hosts parsing endpoints, task CRUD, recommendation engine |
| Storage | Postgres (Supabase) | Tables: users, goals, tasks, daily_availability, learning_history |
| Learning content | Curated feed + optional web search (SerpAPI/Bing) | Cached metadata to avoid repeated fetching |
| Brief delivery | AWS SES / Resend for HTML emails; minimal React web view | Web view supports inline edits |

## Data Model Sketch

- `users`: onboarding info, notification preferences.
- `goals`: goal text, target role, skills focus.
- `tasks`: FK to user, text, status, source (pdf/manual), estimated_minutes, due_date.
- `daily_availability`: date, minutes_available, captured_from.
- `learning_history`: suggestion metadata, completion flag, timestamps.
- `recommendation_cache`: persisted content to enforce rotation/quota.

## AI/Automation Modules

1. **PDF-to-Task Parser**
   - Pipeline: OCR → text normalization → bullet detection → heuristic + LLM classification.
   - Outputs structured list with estimated durations extracted from text (e.g., “(30m)”).
   - Confidence threshold to trigger fallback manual review.

2. **Learning Recommender**
   - Input vector: goal embedding + skills gap + recent completions + available minutes.
   - Content sources: curated library + live job market/news search.
   - Diversity logic to ensure mix of activity types and time lengths.

3. **Brief Generator**
   - Template-driven HTML with personalization copy.
   - Optionally use LLM for motivational summary sentence.

## Delivery Surface

- **Morning email** (default 7 AM local time) includes CTA to web view.
- **Web dashboard** provides interactive checklist, add/edit, and learning cards with external links.
- **Evening entry** page with upload widget and manual form.

## Security & Privacy

- Store PDFs securely; delete raw files after parsing once processed.
- All endpoints behind auth (Magic link or simple passwordless to start).
- Audit log of task modifications for traceability.

## Milestone Plan

1. **Foundation (Week 1)**
   - Repo setup, FastAPI backend skeleton, Postgres schema migration, basic React UI scaffold.
   - User onboarding form + goal storage.

2. **Capture & Storage (Week 2)**
   - PDF upload endpoint + manual entry UI.
   - Basic parsing (text PDFs first) and task CRUD APIs.

3. **Daily Brief (Week 3)**
   - Scheduled job to assemble morning brief from stored tasks + availability.
   - HTML email template + SES/Resend integration.

4. **Learning Engine (Week 4)**
   - Seed curated content DB and implement recommendation selection logic.
   - Incorporate available time + rotation constraints.

5. **Polish & Automations (Week 5)**
   - OCR fallback, reminder notifications, carry-forward logic, analytics dashboard.

## Immediate Next Steps

1. Wire Resend + scheduled brief sender that emails the JSON summary.
2. Build the lightweight React dashboard for onboarding, manual entry, and checklist interactions.
3. Add PDF ingestion (upload + parsing) and store parsed tasks with provenance.
4. Flesh out the learning content library + heuristics, then swap in LLM/web-search powered suggestions.
5. Add authentication (passwordless magic links) and audit logging ahead of any pilot users.

## Frontend UX Playground

- Located in `frontend/` (React + Vite + TypeScript).
- Mirrors the evening capture journey: goal/onboarding form, manual task entry list, availability slider, PDF upload placeholder, and morning brief preview.
- Runs entirely on mocked data/state so copy and interactions can be validated before wiring real APIs.
- Uses Zustand for local state and React Hook Form for onboarding inputs; swapping to live API calls later only requires re-pointing the action handlers.
- Integration targets once backend endpoints stabilize:
  1. Onboarding form → `POST /api/v1/onboarding`
  2. Manual task CRUD → `GET/POST /api/v1/tasks`
  3. Availability input → `POST /api/v1/availability`
  4. Morning brief preview → `POST /api/v1/briefs`
  5. PDF upload placeholder → upcoming `POST /api/v1/uploads/pdf`
- Daily tab also includes an experimental AI Copilot chat surface; today it uses mocked responses and can be triggered from a task card (“Ask AI for help”) to explore the future task-driving experience.

## Development Setup

1. `cd backend`
2. Install Poetry if needed, then `poetry install`
3. Copy `.env.example` to `.env` and set `DATABASE_URL`
4. Run `poetry run alembic upgrade head` to create tables
5. Start the API with `poetry run uvicorn app.main:app --reload`
6. (Optional) Frontend UX playground:
   - `cd ../frontend`
   - `npm install`
   - `npm run dev` to launch the Vite app with mocked planner flows
