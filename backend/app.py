from flask import Flask, render_template, redirect, url_for, request, session

app = Flask(__name__,
            template_folder='../frontend/templates',
            static_folder='../frontend/static')

app.secret_key = 'campusshare-secret-key-change-in-production'

# ── Demo credentials ──────────────────────────────────────────
CREDENTIALS = {
    'student': {'email': 'student@campus.edu', 'password': 'student123'},
    'admin':   {'email': 'admin@campus.edu',   'password': 'admin123'},
}

# ── Auth helpers ──────────────────────────────────────────────
def login_required(role=None):
    """Returns None if OK, else a redirect response."""
    if 'role' not in session:
        return redirect(url_for('login'))
    if role and session.get('role') != role:
        return redirect(url_for('login'))
    return None

# ── Routes ───────────────────────────────────────────────────

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        role     = request.form.get('role', 'student')
        email    = request.form.get('email', '').strip()
        password = request.form.get('password', '')

        creds = CREDENTIALS.get(role)
        if creds and email == creds['email'] and password == creds['password']:
            session['role']  = role
            session['email'] = email
            session['name']  = 'Admin' if role == 'admin' else 'Student'
            return redirect(url_for('admin') if role == 'admin' else url_for('dashboard'))
        else:
            return render_template('login.html', error='Invalid credentials. Please try again.')

    return render_template('login.html', error=None)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/')
def index():
    guard = login_required()
    if guard: return guard
    return render_template('index.html', role=session['role'], name=session['name'])

@app.route('/dashboard')
def dashboard():
    guard = login_required()
    if guard: return guard
    return render_template('dashboard.html', role=session['role'], name=session['name'])

@app.route('/transactions')
def transactions():
    guard = login_required()
    if guard: return guard
    return render_template('transactions.html', role=session['role'], name=session['name'])

@app.route('/materials')
def materials():
    guard = login_required()
    if guard: return guard
    return render_template('materials.html', role=session['role'], name=session['name'])

@app.route('/upload')
def upload():
    guard = login_required()
    if guard: return guard
    return render_template('upload.html', role=session['role'], name=session['name'])

@app.route('/history')
def history():
    guard = login_required()
    if guard: return guard
    return render_template('history.html', role=session['role'], name=session['name'])

@app.route('/admin')
def admin():
    guard = login_required(role='admin')
    if guard: return guard
    return render_template('admin.html', role=session['role'], name=session['name'])

if __name__ == '__main__':
    app.run(debug=True)
