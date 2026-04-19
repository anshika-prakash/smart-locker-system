from flask import Flask, render_template

app = Flask(__name__, 
            template_folder='../frontend/templates', 
            static_folder='../frontend/static')

@app.route('/')
def login():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/my-items')
def my_items():
    return render_template('my_items.html')

@app.route('/upload')
def upload():
    return render_template('upload.html')

# Start the server
if __name__ == '__main__':
    app.run(debug=True)