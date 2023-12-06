from flask import Flask, render_template, request
from flask_migrate import Migrate
import datetime
import os
import yaml
from .routes import networks, peers, settings, users, wizard

__version__ = "0.1.11b2"

basedir = os.getcwd()


def create_app():
    # Initialize the Flask application
    app = Flask(__name__)
    app.basedir = basedir

    ## CONFIGURATION ##

    # Read config.yaml
    with open("config.yaml") as f:
        config = yaml.safe_load(f)
    # Replace {basedir} in all keys with the current working directory
    for key in config:
        if isinstance(config[key], str):
            config[key] = config[key].format(basedir=basedir)
    # Set the configuration from config.yaml
    app.config.update(config)

    # Check if certificates exist and create them if they don't
    if not os.path.exists(app.config["PKI_CERT_PATH"]):
        os.makedirs(app.config["PKI_CERT_PATH"])
    if not os.path.exists(app.config["PKI_CERT_PATH"] + "/" + app.config["PKI_CERT"]):
        from .routes import helpers
        helpers.generate_cert(app.config["PKI_CERT_PATH"], app.config["PKI_CERT"], app.config["PKI_KEY"])
    if not os.path.exists(app.config["PKI_CERT_PATH"] +"/" + app.config["PKI_KEY"]):
        helpers.generate_cert(app.config["PKI_CERT_PATH"], app.config["PKI_CERT"], app.config["PKI_KEY"])


    # Initialize the database with the app
    from .models import db  

    db.init_app(app)
    # Initialize Migrate with the app and the database
    migrate = Migrate(app, db)

    # Create all the database tables within the app context
    with app.app_context():
        db.create_all()

    ## ROUTES ##
    # Route for the index page
    @app.route("/")
    def index():
        # Render the index page with the current UTC time
        return render_template("index.html", utc_dt=datetime.datetime.utcnow())

    # Route for the about page
    @app.route("/about")
    def about():
        # Render the about page with the current UTC time
        return render_template("about.html", version=__version__)

    # Route for the dashboard page
    @app.route("/dashboard")
    def dashboard():
        # Render the dashboard page with the current UTC time
        return render_template("dashboard.html", utc_dt=datetime.datetime.utcnow())

    # Route for testing purposes - Delete when dev work completed
    @app.route("/test")
    def test():
        return render_template("test.html")

    # Import the blueprints
    app.register_blueprint(networks)
    app.register_blueprint(peers)
    app.register_blueprint(settings)
    app.register_blueprint(users)
    app.register_blueprint(wizard)

    return app
