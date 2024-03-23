from flask import Flask, render_template, request
from flask_migrate import Migrate
import os
import yaml
from .routes import dashboard, main, networks, peers, settings, users, wizard

version = "0.3.2b0"


basedir = os.getcwd()

## TEST DATA ##
peers_data = {
    "active": 3,
    "inactive": 1,
    "lighthouse": 3
    }


def create_app():
    # Initialize the Flask application
    app = Flask(__name__)
    app.basedir = basedir
    app.__version__ = version

    
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

    # Check if this is a linux system
    if str(os.name) == "posix":
        app.config["LINUX"] = True
    else:
        app.config["LINUX"] = False


    # Check if certificates exist and create them if they don't
    if not os.path.exists(app.config["PKI_CERT_PATH"]):
        os.makedirs(app.config["PKI_CERT_PATH"])
    if not os.path.exists(app.config["PKI_CERT_PATH"] + "/" + app.config["PKI_CERT"]):
        from .routes import helpers
        helpers.generate_cert(app.config["PKI_CERT_PATH"], app.config["PKI_CERT"], app.config["PKI_KEY"])
    if not os.path.exists(app.config["PKI_CERT_PATH"] +"/" + app.config["PKI_KEY"]):
        helpers.generate_cert(app.config["PKI_CERT_PATH"], app.config["PKI_CERT"], app.config["PKI_KEY"])

    @app.context_processor
    def inject_mode():
        return dict(mode=app.config["MODE"])

    # Initialize the database with the app
    from .models import db  

    db.init_app(app)
    # Initialize Migrate with the app and the database
    migrate = Migrate(app, db)

    # Create all the database tables within the app context
    with app.app_context():
        db.create_all()

    # Initialize the login manager with the app
    from flask_login import LoginManager
    login_manager = LoginManager()
    login_manager.login_view = 'user.login'
    login_manager.init_app(app)

    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    ## ROUTES ##

    # Import the blueprints
    app.register_blueprint(dashboard)
    app.register_blueprint(main)
    app.register_blueprint(networks)
    app.register_blueprint(peers)
    app.register_blueprint(settings)
    app.register_blueprint(users)
    app.register_blueprint(wizard)

    return app

    
