import sqlite3

connection = sqlite3.connect("database.db")


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
