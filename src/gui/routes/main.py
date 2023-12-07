from flask import Blueprint, current_app, render_template
from flask_login import current_user, login_required
from gui.models import db

main = Blueprint('main', __name__)

@main.route("/")
def index():
    # Render the index page with the current UTC time
    return render_template("index.html")

# Route for the about page
@main.route("/about")
def about():
    # Render the about page with the current UTC time
    return render_template("about.html", version=current_app.__version__)

# Route for the dashboard page
@main.route("/dashboard")
def dashboard():
    # Render the dashboard page with the current UTC time
    return render_template("dashboard.html")

# Route for the user profile page
@main.route('/profile')
@login_required
def profile():
    return render_template('profile.html', current_user=current_user)

# Route for testing purposes - Delete when dev work completed
@main.route("/test")
def test():
    return render_template("test.html")