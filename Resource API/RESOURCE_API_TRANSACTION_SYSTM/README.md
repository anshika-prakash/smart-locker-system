# ASEP resource management — transactions lab

Backend-first Flask app for borrowing and returning college resources, plus **browser portals** so you can exercise the JSON API with clear separation between **student** and **admin** workflows.

## Quick start

1. Create a Python virtual environment (recommended), then install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Ensure your SQLite file `college.db` exists in this folder and contains the `users`, `resources`, and `transactions` tables your course schema expects.

3. Run the app:

   ```bash
   python app.py
   ```

4. Open **http://127.0.0.1:5000/** for the hub, then choose:
   - **http://127.0.0.1:5000/student/** — student model logins, borrow/return **buttons** and drag-and-drop
   - **http://127.0.0.1:5000/admin/** — admin model login, full transaction log, add test resources

Click **Seed demo data** once on either portal if presets are disabled.

Set `FLASK_SECRET_KEY` in the environment for anything beyond local play; otherwise Flask uses a development default.

## What each file does

| File | Purpose |
|------|--------|
| **app.py** | Flask app: transaction API (`/borrow`, `/return`, `/transactions`, `/transactions/me`), demo helpers (`/demo/*`), JSON error handling, SQLite. Serves `/` (hub), `/student/`, `/admin/`. |
| **requirements.txt** | Python dependency pin for Flask. |
| **college.db** | SQLite database (users, resources, transactions). |
| **static/index.html** | **Hub** landing: short explanation and links to student and admin portals. |
| **static/shared/lab.css** | Shared layout and components for both portals (panels, lanes, cards, tables, toasts). |
| **static/shared/api.js** | Shared browser helpers: `fetch` with session cookie, JSON parse + error surface, toasts. |
| **static/student/index.html** | Student portal page shell. |
| **static/student/student.js** | Student UI logic: student-only presets, **Borrow** / **Return** buttons on cards, drag-and-drop, `/demo/state` table. |
| **static/admin/index.html** | Admin portal page shell. |
| **static/admin/admin.js** | Admin UI logic: preset, add/remove available resources, read-only lanes, `GET /transactions`, refresh. |
| **README.md** | This document. |

## Core HTTP API (JSON)

| Method & path | Who | Description |
|---------------|-----|--------------|
| `POST /borrow` | Student session | Body: `{ "resource_id": <int>, "due_in_days"?: <int> }`. **201** on success. (Optional `X-Demo-Time-Offset-Days` header still affects due-date math if set manually.) |
| `POST /return` | Student session | Body: `{ "resource_id": <int> }`. **201** on success. |
| `GET /transactions` | Admin session | Full joined log. **200**. |
| `GET /transactions/me` | Student session | Current student’s history. **200**. |

## Demo / lab endpoints

| Method & path | Auth | Description |
|---------------|------|--------------|
| `GET /demo/bootstrap` | No | Preset accounts (ids, roll numbers, roles). |
| `POST /demo/seed` | No | Idempotent demo users + sample resources. |
| `POST /demo/login` | No | Sets session (`preset`, `roll_no`, or `user_id`). |
| `POST /demo/logout` | No | Clears session. |
| `GET /demo/state` | Yes | Snapshot: available/borrowed lists, recent transactions (scope differs by role). |
| `POST /demo/add-resources` | Admin | Bulk-create available resources. |
| `POST /demo/remove-available-resources` | Admin | Body: `{ "resource_ids": [ ... ] }`. Deletes those rows only if each is currently `available`. |

## Notes

- Both portals show **Total items borrowed** (length of the Borrowed lane from `/demo/state`). Use **Refresh transactions** to pull the latest rows without reloading the whole page.
- **Admin** portal: **Remove from catalog** is a checklist of currently available resources; **Remove selected** permanently deletes those rows (`POST /demo/remove-available-resources`).
- The **Return** button on the student portal only appears when you are the **active borrower** for that resource (same rule as `POST /return`).
- If `POST /demo/seed` fails, align your SQLite schema with the inserts in `app.py` (`_seed_demo_users_and_resources`).

When you want more features, describe the workflow and we can extend API and portals together.
