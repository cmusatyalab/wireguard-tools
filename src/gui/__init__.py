from flask import Flask, render_template, request, redirect, url_for, flash
import datetime
import os

basedir = os.getcwd()

# Function to create the Flask application
def create_app():
    # Initialize the Flask application
    app = Flask(__name__)
    # Disable track modifications for SQLAlchemy
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    # Set the database URI for SQLAlchemy
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{basedir}/dev.db"

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
    
    # Import the network module and register its blueprint
    from . import network
    app.register_blueprint(network.bp)

    # Import the peer module and register its blueprint
    from . import peer
    app.register_blueprint(peer.bp)

    # Import the setting module and register its blueprint
    from . import setting
    app.register_blueprint(setting.bp)

    # Return the app
    return app
