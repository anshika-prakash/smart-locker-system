from flask import Flask, render_template, redirect, url_for, request, session

app = Flask(
    __name__,
    template_folder='../frontend/templates',
    static_folder='../frontend/static'
)

app.secret_key = 'campusshare-secret-key-change-in-production'

# ── Demo credentials ──────────────────────────────────────────
CREDENTIALS = {
    'student': {
        'email': 'student@campus.edu',
        'password': 'student123'
    },
    'admin': {
        'email': 'admin@campus.edu',
        'password': 'admin123'
    },
}

# ── Auth helper ───────────────────────────────────────────────
def login_required(role=None):
    """
    Returns None if logged in.
    Else redirects to login page.
    """

    if 'role' not in session:
        return redirect(url_for('login'))

    if role and session.get('role') != role:

        if session.get('role') == 'admin':
            return redirect(url_for('admin'))

        return redirect(url_for('dashboard'))

    return None


# ── Routes ───────────────────────────────────────────────────

@app.route('/')
def root():
    # ALWAYS open login page first
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():

    # If form submitted
    if request.method == 'POST':

        role = request.form.get('role', 'student')
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')

        creds = CREDENTIALS.get(role)

        # Check correct role + email + password
        if creds and email == creds['email'] and password == creds['password']:

            session.clear()

            session['role'] = role
            session['email'] = email
            session['name'] = 'Admin' if role == 'admin' else 'Student'

            if role == 'admin':
                return redirect(url_for('admin'))

            return redirect(url_for('dashboard'))

        else:
            return render_template(
                'login.html',
                error='Invalid email, password, or role.'
            )

    # If GET request:
    # even if already logged in, still show login page
    return render_template('login.html', error=None)


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


@app.route('/home')
def index():
    guard = login_required()
    if guard:
        return guard

    return render_template(
        'index.html',
        role=session['role'],
        name=session['name']
    )


@app.route('/dashboard')
def dashboard():
    guard = login_required()
    if guard:
        return guard

    return render_template(
        'dashboard.html',
        role=session['role'],
        name=session['name']
    )


@app.route('/transactions')
def transactions():
    guard = login_required()
    if guard:
        return guard

    return render_template(
        'transactions.html',
        role=session['role'],
        name=session['name']
    )


@app.route('/materials')
def materials():
    guard = login_required()
    if guard:
        return guard

    return render_template(
        'materials.html',
        role=session['role'],
        name=session['name']
    )


@app.route('/upload')
def upload():
    guard = login_required()
    if guard:
        return guard

    return render_template(
        'upload.html',
        role=session['role'],
        name=session['name']
    )


@app.route('/history')
def history():
    guard = login_required()
    if guard:
        return guard

    return render_template(
        'history.html',
        role=session['role'],
        name=session['name']
    )


@app.route('/admin')
def admin():
    guard = login_required(role='admin')
    if guard:
        return guard

    return render_template(
        'admin.html',
        role=session['role'],
        name=session['name']
    )


if __name__ == '__main__':
    app.run(debug=True)