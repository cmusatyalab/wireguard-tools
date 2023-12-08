from flask import Blueprint, current_app, flash, redirect, render_template, url_for
from flask_login import current_user, login_required
from gui.models import User

main = Blueprint('main', __name__)

## ROUTES ##

# Route for the home page
@main.route("/")
def index():
    # Check to see if the admin user has been created yet
    user_count = User.query.count()
    if user_count == 0:
        message = "No users found. Please create an admin user."
        flash(message, "warning")
        return redirect(url_for("user.register", admin=True))
    return render_template("index.html")

# Route for the about page
@main.route("/about")
def about():
    version = current_app.__version__
    return render_template("about.html", version=version)


# Route for the user profile page
@main.route('/profile')
@login_required
def profile():
    return render_template('profile.html', current_user=current_user)

# Route for testing purposes - Delete when dev work completed
@main.route("/test")
def test():
    message = "Test Message"
    flash(message, "success")
    return render_template("test.html")