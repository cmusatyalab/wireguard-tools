from flask import Flask, render_template, request
from flask_migrate import Migrate
import datetime
import os
from .routes import networks, peers, settings

basedir = os.getcwd()

def create_app():
    # Initialize the Flask application
    app = Flask(__name__)
    # Disable track modifications for SQLAlchemy
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
    # Set the database URI for SQLAlchemy
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{basedir}/wg.db"

    # Initialize the database with the app
    from .models import db  # Move the import here
    db.init_app(app)
    # Initialize Migrate with the app and the database
    migrate = Migrate(app, db)

    # Create all the database tables within the app context
    with app.app_context():
        db.create_all()

    # Route for the index page
    @app.route('/')
    def index():
        # Render the index page with the current UTC time
        return render_template('index.html', utc_dt=datetime.datetime.utcnow())

    # Route for the about page
    @app.route('/about')
    def about():
        # Render the about page with the current UTC time
        return render_template('about.html', utc_dt=datetime.datetime.utcnow())

    # Route for the dashboard page
    @app.route('/dashboard')
    def dashboard():
        # Render the dashboard page with the current UTC time
        return render_template('dashboard.html', utc_dt=datetime.datetime.utcnow())

    # Import the blueprints
    app.register_blueprint(networks)
    app.register_blueprint(peers)
    app.register_blueprint(settings)

    return app
