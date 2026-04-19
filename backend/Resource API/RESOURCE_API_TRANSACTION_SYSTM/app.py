"""
Flask application for the college resource management system (transactions lab).

Core JSON API:
  POST /borrow, POST /return, GET /transactions, GET /transactions/me

Demo / lab helpers (for the browser dashboard and quick testing):
  GET  /demo/bootstrap   — public; preset accounts and whether DB has demo rows
  POST /demo/seed      — public; idempotent seed of demo users + sample resources
  POST /demo/login     — sets session (preset key or roll_no or user_id)
  POST /demo/logout    — clears session
  GET  /demo/state     — snapshot for the UI (requires login)
  POST /demo/add-resources — admin only; bulk-create available resources
  POST /demo/remove-available-resources — admin only; delete selected available rows

Static UI:
  GET /           — hub (static/index.html) linking to student and admin portals
  GET /student/   — student portal (static/student/index.html)
  GET /admin/     — admin portal (static/admin/index.html)
"""

import os
import sqlite3
import uuid
from datetime import datetime, timedelta

from flask import Flask, g, jsonify, redirect, request, send_from_directory, session
from werkzeug.exceptions import HTTPException

# Absolute path to the SQLite file co-located with this module.
DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "college.db")

# Roll numbers used by the seed routine; the lab UI references them as “model IDs”.
DEMO_USERS_SPEC = (
    ("student_a", "Demo Student A", "DEMO-1001", "student"),
    ("student_b", "Demo Student B", "DEMO-1002", "student"),
    ("admin_main", "Demo Admin", "DEMO-9999", "admin"),
)

app = Flask(__name__, static_folder="static", static_url_path="/static")
app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY", "dev-change-me")


def get_db():
    """Open one SQLite connection per request and stash it on Flask's g object."""
    if "db" not in g:
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        g.db = conn
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    """Ensure the connection opened in get_db() is closed when the request ends."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def json_error(message, status_code):
    """Uniform JSON error envelope used by all routes."""
    return jsonify({"success": False, "message": message}), status_code


def require_login():
    """
    Read session-based auth assumed to be set elsewhere (or via /demo/login).

    Returns (auth_dict, None) on success, or (None, (response, status)) on failure.
    """
    user_id = session.get("user_id")
    role = session.get("role")
    if user_id is None or role is None:
        return None, json_error("Authentication required", 401)
    return {"user_id": int(user_id), "role": str(role)}, None


def is_json_api_request():
    """
    True for JSON API paths so error handlers return JSON instead of HTML
    (the lab UI uses res.json(); HTML tracebacks show as “Non-JSON response”).
    """
    p = request.path or ""
    if p in ("/borrow", "/return"):
        return True
    if p.startswith("/transactions"):
        return True
    if p.startswith("/demo/"):
        return True
    return False


@app.errorhandler(HTTPException)
def _http_exception_as_json(exc):
    if is_json_api_request():
        msg = exc.description or exc.name or "Request error"
        return jsonify({"success": False, "message": msg}), exc.code
    return exc.get_response()


@app.errorhandler(Exception)
def _uncaught_exception_as_json(exc):
    """Convert unhandled errors on API routes to JSON (e.g. missing SQLite tables)."""
    if is_json_api_request():
        app.logger.exception("Unhandled API error")
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Server error",
                    "detail": str(exc),
                }
            ),
            500,
        )
    raise exc


def demo_clock_offset_days():
    """
    Optional lab header shifts “now” when computing due dates only.
    Example: X-Demo-Time-Offset-Days: 10 pretends today is 10 days ahead.
    """
    raw = request.headers.get("X-Demo-Time-Offset-Days", "0") or "0"
    try:
        n = int(raw)
    except ValueError:
        return 0
    return max(-365, min(365, n))


@app.get("/")
def lab_home():
    """Hub page with links to the student and admin portals (static/index.html)."""
    return send_from_directory(app.static_folder, "index.html")


@app.get("/student")
def student_portal_redirect():
    """Normalize URL so relative links and static paths resolve predictably."""
    return redirect("/student/", code=302)


@app.get("/student/")
def student_portal():
    """Student-facing lab UI (borrow/return, model student logins)."""
    return send_from_directory(os.path.join(app.static_folder, "student"), "index.html")


@app.get("/admin")
def admin_portal_redirect():
    return redirect("/admin/", code=302)


@app.get("/admin/")
def admin_portal():
    """Admin-facing lab UI (full log, add resources, model admin login)."""
    return send_from_directory(os.path.join(app.static_folder, "admin"), "index.html")


@app.get("/demo/bootstrap")
def demo_bootstrap():
    """
    Public endpoint so the UI can label buttons before anyone logs in.
    Looks up demo users by roll_no and returns stable preset keys.
    """
    try:
        db = get_db()
        rows = []
        for key, _name, roll, role in DEMO_USERS_SPEC:
            row = db.execute(
                "SELECT user_id, name, roll_no, role FROM users WHERE roll_no = ?",
                (roll,),
            ).fetchone()
            if row:
                rows.append(
                    {
                        "preset": key,
                        "user_id": row["user_id"],
                        "name": row["name"],
                        "roll_no": row["roll_no"],
                        "role": row["role"],
                    }
                )
        res_count = db.execute("SELECT COUNT(*) AS c FROM resources").fetchone()[
            "c"
        ]
        txn_count = db.execute("SELECT COUNT(*) AS c FROM transactions").fetchone()[
            "c"
        ]
    except sqlite3.Error as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": (
                        "SQLite error (missing college.db tables or wrong path?). "
                        f"Details: {e}"
                    ),
                    "data": {"accounts": []},
                }
            ),
            503,
        )
    return (
        jsonify(
            {
                "success": True,
                "message": "Lab bootstrap",
                "data": {
                    "accounts": rows,
                    "resource_row_count": res_count,
                    "transaction_row_count": txn_count,
                },
            }
        ),
        200,
    )


def _seed_demo_users_and_resources(db):
    """
    Insert demo users (by unique roll_no) and a handful of resources if missing.
    Compatible with the fuller ASEP schema (branch, year, password_hash, etc.).
    """
    for _key, name, roll, role in DEMO_USERS_SPEC:
        exists = db.execute(
            "SELECT 1 FROM users WHERE roll_no = ?", (roll,)
        ).fetchone()
        if exists:
            continue
        db.execute(
            """
            INSERT INTO users (
                name, roll_no, rfid_uid, branch, year, password_hash, role
            )
            VALUES (?, ?, NULL, 'DEMO', 1, 'demo-not-for-production', ?)
            """,
            (name, roll, role),
        )

    # Ensure a few borrowable rows exist (idempotent by name prefix).
    existing_demo = db.execute(
        "SELECT COUNT(*) AS c FROM resources WHERE name LIKE 'Demo Lab%'"
    ).fetchone()["c"]
    target_demo = 6
    need = max(0, target_demo - existing_demo)
    for i in range(need):
        locker = f"L-DEMO-{uuid.uuid4().hex[:6].upper()}"
        db.execute(
            """
            INSERT INTO resources (name, category, locker_id, status, total_count)
            VALUES (?, 'general', ?, 'available', 1)
            """,
            (f"Demo Lab item {existing_demo + i + 1}", locker),
        )


@app.post("/demo/seed")
def demo_seed():
    """Create demo accounts/resources if they are not already present."""
    db = get_db()
    try:
        db.execute("BEGIN")
        _seed_demo_users_and_resources(db)
        db.commit()
    except sqlite3.Error:
        db.rollback()
        return json_error("Unable to seed demo data", 400)
    return jsonify({"success": True, "message": "Demo data ready", "data": {}}), 201


@app.post("/demo/login")
def demo_login():
    """
    Model login for the lab page: pass preset ("student_a"), roll_no, or user_id.
    Stores minimal session keys consumed by the core API routes.
    """
    body = request.get_json(silent=True) or {}
    preset = body.get("preset")
    roll_no = body.get("roll_no")
    user_id = body.get("user_id")
    db = get_db()

    if preset:
        roll_map = {k: r for k, _n, r, _role in DEMO_USERS_SPEC}
        roll_no = roll_map.get(preset)
        if not roll_no:
            return json_error("Unknown preset", 400)

    row = None
    if roll_no:
        row = db.execute(
            "SELECT user_id, name, roll_no, role FROM users WHERE roll_no = ?",
            (str(roll_no),),
        ).fetchone()
    elif user_id is not None:
        try:
            uid = int(user_id)
        except (TypeError, ValueError):
            return json_error("user_id must be an integer", 400)
        row = db.execute(
            "SELECT user_id, name, roll_no, role FROM users WHERE user_id = ?",
            (uid,),
        ).fetchone()
    else:
        return json_error("Provide preset, roll_no, or user_id", 400)

    if row is None:
        return json_error("User not found — try POST /demo/seed first", 404)

    session["user_id"] = row["user_id"]
    session["role"] = row["role"]
    session["display_name"] = row["name"]
    return (
        jsonify(
            {
                "success": True,
                "message": "Logged in",
                "data": {
                    "user_id": row["user_id"],
                    "name": row["name"],
                    "roll_no": row["roll_no"],
                    "role": row["role"],
                },
            }
        ),
        200,
    )


@app.post("/demo/logout")
def demo_logout():
    """Clear the session cookie."""
    session.clear()
    return jsonify({"success": True, "message": "Logged out", "data": {}}), 200


@app.get("/demo/state")
def demo_state():
    """
    Rich snapshot for the dashboard: resources split by status, optional borrower,
    recent transactions, and session summary.
    """
    auth, err = require_login()
    if err:
        return err
    db = get_db()

    resources = db.execute(
        """
        SELECT
            resource_id,
            name,
            locker_id,
            status,
            COALESCE(total_count, 1) AS total_count
        FROM resources
        ORDER BY resource_id ASC
        """
    ).fetchall()

    borrowers = {}
    for r in resources:
        if r["status"] != "borrowed":
            continue
        last = db.execute(
            """
            SELECT t.user_id, u.name AS user_name
            FROM transactions t
            JOIN users u ON u.user_id = t.user_id
            WHERE t.resource_id = ?
            ORDER BY t.txn_id DESC
            LIMIT 1
            """,
            (r["resource_id"],),
        ).fetchone()
        if last:
            borrowers[r["resource_id"]] = {
                "user_id": last["user_id"],
                "name": last["user_name"],
            }

    available, borrowed = [], []
    for r in resources:
        item = dict(r)
        b = borrowers.get(r["resource_id"])
        if b:
            item["active_borrower"] = b
        if r["status"] == "available":
            available.append(item)
        else:
            borrowed.append(item)

    tx_limit = 80
    if auth["role"] == "admin":
        tx_rows = db.execute(
            """
            SELECT
                t.txn_id,
                t.user_id,
                u.name AS user_name,
                t.resource_id,
                r.name AS resource_name,
                t.action,
                t.timestamp,
                t.due_date
            FROM transactions t
            JOIN users u ON u.user_id = t.user_id
            JOIN resources r ON r.resource_id = t.resource_id
            ORDER BY t.txn_id DESC
            LIMIT ?
            """,
            (tx_limit,),
        ).fetchall()
    else:
        tx_rows = db.execute(
            """
            SELECT
                t.txn_id,
                t.resource_id,
                r.name AS resource_name,
                t.action,
                t.timestamp,
                t.due_date
            FROM transactions t
            JOIN resources r ON r.resource_id = t.resource_id
            WHERE t.user_id = ?
            ORDER BY t.txn_id DESC
            LIMIT ?
            """,
            (auth["user_id"], tx_limit),
        ).fetchall()

    return (
        jsonify(
            {
                "success": True,
                "message": "State snapshot",
                "data": {
                    "session": {
                        "user_id": auth["user_id"],
                        "role": auth["role"],
                        "name": session.get("display_name"),
                    },
                    "available": available,
                    "borrowed": borrowed,
                    "transactions": [dict(x) for x in tx_rows],
                },
            }
        ),
        200,
    )


@app.post("/demo/add-resources")
def demo_add_resources():
    """Admin-only helper to grow the pool of available resources for drag/drop tests."""
    auth, err = require_login()
    if err:
        return err
    if auth["role"] != "admin":
        return json_error("Admin access required", 403)

    body = request.get_json(silent=True) or {}
    try:
        count = int(body.get("count", 1))
    except (TypeError, ValueError):
        return json_error("count must be an integer", 400)
    count = max(1, min(50, count))

    db = get_db()
    created = []
    try:
        db.execute("BEGIN")
        for _ in range(count):
            locker = f"L-LAB-{uuid.uuid4().hex[:8].upper()}"
            cur = db.execute(
                """
                INSERT INTO resources (name, category, locker_id, status, total_count)
                VALUES (?, 'general', ?, 'available', 1)
                """,
                (f"Lab Resource {uuid.uuid4().hex[:6]}", locker),
            )
            created.append(cur.lastrowid)
        db.commit()
    except sqlite3.Error:
        db.rollback()
        return json_error("Unable to add resources", 400)

    return (
        jsonify(
            {
                "success": True,
                "message": f"Added {count} available resources",
                "data": {"resource_ids": created},
            }
        ),
        201,
    )


@app.post("/demo/remove-available-resources")
def demo_remove_available_resources():
    """
    Admin-only lab cleanup: permanently delete resource rows that are still available.
    Body: { "resource_ids": [1, 2, 3] } — every id must exist and have status 'available'.
    """
    auth, err = require_login()
    if err:
        return err
    if auth["role"] != "admin":
        return json_error("Admin access required", 403)

    body = request.get_json(silent=True) or {}
    raw_ids = body.get("resource_ids")
    if not isinstance(raw_ids, list) or len(raw_ids) == 0:
        return json_error("JSON body must include non-empty resource_ids array", 400)

    ids = []
    for x in raw_ids:
        try:
            ids.append(int(x))
        except (TypeError, ValueError):
            return json_error("resource_ids must be integers", 400)
    ids = list(dict.fromkeys(ids))
    if len(ids) > 200:
        return json_error("Too many ids in one request (max 200)", 400)

    db = get_db()
    placeholders = ",".join("?" * len(ids))
    try:
        db.execute("BEGIN IMMEDIATE")
        rows = db.execute(
            f"""
            SELECT resource_id, status FROM resources
            WHERE resource_id IN ({placeholders})
            """,
            ids,
        ).fetchall()
        found = {int(r["resource_id"]): r["status"] for r in rows}
        for rid in ids:
            if rid not in found:
                db.rollback()
                return json_error(f"Resource not found: {rid}", 404)
            if found[rid] != "available":
                db.rollback()
                return json_error(
                    f"Resource {rid} is not available (status: {found[rid]}); return or delete loans first",
                    400,
                )
        db.execute(
            f"DELETE FROM resources WHERE resource_id IN ({placeholders}) AND status = 'available'",
            ids,
        )
        db.commit()
    except sqlite3.Error:
        db.rollback()
        return json_error("Unable to remove resources", 400)

    return (
        jsonify(
            {
                "success": True,
                "message": f"Removed {len(ids)} available resource(s)",
                "data": {"deleted_resource_ids": ids},
            }
        ),
        200,
    )


@app.post("/borrow")
def borrow():
    """
    Student borrows a resource: must be available, then status becomes borrowed.
    Optional JSON due_in_days (default 7). Optional header X-Demo-Time-Offset-Days
    shifts the computed due_date for lab visualization.
    """
    auth, err = require_login()
    if err:
        return err
    if auth["role"] != "student":
        return json_error("Only students can borrow resources", 403)

    body = request.get_json(silent=True)
    if not body or "resource_id" not in body:
        return json_error("JSON body must include resource_id", 400)

    try:
        resource_id = int(body["resource_id"])
    except (TypeError, ValueError):
        return json_error("resource_id must be an integer", 400)

    raw_days = body.get("due_in_days", 7)
    try:
        due_in_days = int(raw_days)
    except (TypeError, ValueError):
        return json_error("due_in_days must be an integer", 400)
    due_in_days = max(1, min(120, due_in_days))

    offset = demo_clock_offset_days()
    due_dt = datetime.now() + timedelta(days=offset + due_in_days)
    due = due_dt.strftime("%Y-%m-%d %H:%M:%S")
    db = get_db()

    try:
        db.execute("BEGIN IMMEDIATE")
        row = db.execute(
            "SELECT status FROM resources WHERE resource_id = ?",
            (resource_id,),
        ).fetchone()
        if row is None:
            db.rollback()
            return json_error("Resource not found", 404)
        if row["status"] != "available":
            db.rollback()
            return json_error("Resource is not available to borrow", 400)

        cur = db.execute(
            """
            INSERT INTO transactions (user_id, resource_id, action, due_date)
            VALUES (?, ?, 'borrow', ?)
            """,
            (auth["user_id"], resource_id, due),
        )
        txn_id = cur.lastrowid
        db.execute(
            "UPDATE resources SET status = 'borrowed' WHERE resource_id = ?",
            (resource_id,),
        )
        db.commit()
    except sqlite3.Error:
        db.rollback()
        return json_error("Unable to complete borrow", 400)

    return (
        jsonify(
            {
                "success": True,
                "message": "Resource borrowed successfully",
                "data": {
                    "txn_id": txn_id,
                    "resource_id": resource_id,
                    "due_date": due,
                    "due_in_days": due_in_days,
                    "demo_time_offset_days": offset,
                },
            }
        ),
        201,
    )


@app.post("/return")
def return_resource():
    """
    Student returns a resource they currently have out (validated via last borrow txn).
    """
    auth, err = require_login()
    if err:
        return err
    if auth["role"] != "student":
        return json_error("Only students can return resources", 403)

    body = request.get_json(silent=True)
    if not body or "resource_id" not in body:
        return json_error("JSON body must include resource_id", 400)

    try:
        resource_id = int(body["resource_id"])
    except (TypeError, ValueError):
        return json_error("resource_id must be an integer", 400)

    db = get_db()

    try:
        db.execute("BEGIN IMMEDIATE")
        res = db.execute(
            "SELECT status FROM resources WHERE resource_id = ?",
            (resource_id,),
        ).fetchone()
        if res is None:
            db.rollback()
            return json_error("Resource not found", 404)
        if res["status"] != "borrowed":
            db.rollback()
            return json_error("Resource is not currently borrowed", 400)

        last = db.execute(
            """
            SELECT user_id, action
            FROM transactions
            WHERE resource_id = ?
            ORDER BY txn_id DESC
            LIMIT 1
            """,
            (resource_id,),
        ).fetchone()

        if last is None or last["action"] != "borrow":
            db.rollback()
            return json_error("Cannot determine active borrower for this resource", 400)
        if last["user_id"] != auth["user_id"]:
            db.rollback()
            return json_error("This resource was borrowed by another user", 403)

        cur = db.execute(
            """
            INSERT INTO transactions (user_id, resource_id, action, due_date)
            VALUES (?, ?, 'return', NULL)
            """,
            (auth["user_id"], resource_id),
        )
        txn_id = cur.lastrowid
        db.execute(
            "UPDATE resources SET status = 'available' WHERE resource_id = ?",
            (resource_id,),
        )
        db.commit()
    except sqlite3.Error:
        db.rollback()
        return json_error("Unable to complete return", 400)

    return (
        jsonify(
            {
                "success": True,
                "message": "Resource returned successfully",
                "data": {"txn_id": txn_id, "resource_id": resource_id},
            }
        ),
        201,
    )


@app.get("/transactions")
def list_transactions():
    """Admin-only full transaction log with friendly names from joins."""
    auth, err = require_login()
    if err:
        return err
    if auth["role"] != "admin":
        return json_error("Admin access required", 403)

    db = get_db()
    rows = db.execute(
        """
        SELECT
            t.txn_id,
            t.user_id,
            u.name AS user_name,
            t.resource_id,
            r.name AS resource_name,
            t.action,
            t.timestamp,
            t.due_date
        FROM transactions t
        JOIN users u ON u.user_id = t.user_id
        JOIN resources r ON r.resource_id = t.resource_id
        ORDER BY t.txn_id ASC
        """
    ).fetchall()

    data = [dict(row) for row in rows]
    return jsonify({"success": True, "message": "Transaction log", "data": data}), 200


@app.get("/transactions/me")
def my_transactions():
    """Student-only history for the logged-in user."""
    auth, err = require_login()
    if err:
        return err
    if auth["role"] != "student":
        return json_error("This endpoint is for students only", 403)

    db = get_db()
    rows = db.execute(
        """
        SELECT
            t.txn_id,
            t.resource_id,
            r.name AS resource_name,
            t.action,
            t.timestamp,
            t.due_date
        FROM transactions t
        JOIN resources r ON r.resource_id = t.resource_id
        WHERE t.user_id = ?
        ORDER BY t.txn_id ASC
        """,
        (auth["user_id"],),
    ).fetchall()

    data = [dict(row) for row in rows]
    return (
        jsonify(
            {
                "success": True,
                "message": "Your transaction history",
                "data": data,
            }
        ),
        200,
    )


if __name__ == "__main__":
    app.run(debug=True)
