import sqlite3
from werkzeug.security import generate_password_hash

conn = sqlite3.connect("database.db")
cursor = conn.cursor()

users = [
("Student User","student@campus.edu","student123","student"),
("Admin User","admin@campus.edu","admin123","admin")
]

for name,email,password,role in users:
    hash_pass = generate_password_hash(password)

    try:
        cursor.execute(
        "INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)",
        (name,email,hash_pass,role))
    except:
        pass

conn.commit()
conn.close()

print("Users Added")