import sqlite3

try:
    print("Connecting to database...")

    connection = sqlite3.connect("database.db")
except Exception as e:
    print(e)
    exit(1)
else:
    print("Connected to database successfully!")


with open("schema.sql") as f:
    connection.executescript(f.read())

cur = connection.cursor()

cur.execute(
    "INSERT INTO peers (public_key,endpoint_host, endpoint_port) VALUES (?, ?, ?)",
    ("iISiPbGn4wSPhloFOtDN2BgqfJ1MqKKkmm0WtWc9sFE=", "123.156.78.9", 51280),
)

cur.execute(
    "INSERT INTO peers (public_key,endpoint_host, endpoint_port) VALUES (?, ?, ?)",
    ("Second Post", "test.fake.net", 51280),
)

connection.commit()
connection.close()
