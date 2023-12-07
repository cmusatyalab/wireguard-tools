from flask import Blueprint, current_app, redirect, render_template, url_for
from flask_login import current_user, login_required
from gui.models import User

main = Blueprint('main', __name__)

@main.route("/")
def index():
    # Check to see if the admin user has been created yet
    user_count = User.query.count()
    #if user_count == 0:
    if 'ADMIN_CREATED' not in current_app.config:
        return redirect(url_for("user.register", admin=True))
    return render_template("index.html")


@main.route("/about")
def about():
    version = current_app.__version__
    print(version)
    return render_template("about.html", version=version)

# Route for the dashboard page
@main.route("/dashboard")
@login_required
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