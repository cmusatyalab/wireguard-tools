from flask_login import UserMixin
from .database import db
from flask_marshmallow import Marshmallow

ma = Marshmallow()


# Create model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True)
    email = db.Column(db.String(50), unique=True)
    password = db.Column(db.String(128))


# JSON Schema
class UserSchema(ma.Schema):
    class Meta:
        fields = ("id", "name", "email", "password")


user_schema = UserSchema()
users_schema = UserSchema(many=True)


def user_load_test_db():
    pass
