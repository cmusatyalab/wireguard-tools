import app
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow

# sqlalchemy instance
db = SQLAlchemy(app)
ma = Marshmallow(app)


# Create models
class Config(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    public_key = db.Column(db.String(50))
    preshared_key = db.Column(db.String(50))
    endpoint_host = db.Column(db.String(50))
    endpoint_port = db.Column(db.Integer)
    persistent_keepalive = db.Column(db.Integer)
    allowed_ips = db.Column(db.String(50))
    friendly_name = db.Column(db.String(50))
    friendly_json = db.Column(db.String(50))
    last_handshake = db.Column(db.String(50))
    rx_bytes = db.Column(db.Integer)
    tx_bytes = db.Column(db.Integer)


# JSON Schema
class ConfigSchema(ma.Schema):
    class Meta:
        fields = (
            "id",
            "public_key",
            "preshared_key",
            "endpoint_host",
            "endpoint_port",
            "persistent_keepalive",
            "allowed_ips",
            "friendly_name",
            "friendly_json",
            "last_handshake",
            "rx_bytes",
            "tx_bytes"
        )


config_schema =ConfigSchema()
configs_schema = ConfigSchema(many=True)


if __name__ == "__main__":
    db.create_all()
    user1 = Config(name="Paul John", email="pj@gmail.com", password="pjmaxson2020#")
    user2 = Config(name="John Doe", email="JD@gmail.com", password="jdmaxson2020#")
    db.session.add_all([user1, user2])
    db.session.commit()
