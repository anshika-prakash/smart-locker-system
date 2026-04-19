from flask import Flask, render_template

app = Flask(__name__, 
            template_folder='../frontend/templates', 
            static_folder='../frontend/static')

# 1. Public Landing Page (The "Normal" Website)
@app.route('/welcome')
def welcome():
    return render_template('landing.html')

# 2. Login Page (The Portal Entry)
@app.route('/')
def login():
    return render_template('index.html')

# 3. Dashboard Page (The Borrowing System)
@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

# 4. Upload Page (Digital Resources)
@app.route('/upload')
def upload():
    return render_template('upload.html')

# The "Ignition Switch" - keep this at the very bottom
if __name__ == '__main__':
    app.run(debug=True)