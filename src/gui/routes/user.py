from flask import Blueprint, current_app, flash, redirect, render_template, request, url_for
from flask_login import login_required, login_user, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
from gui.models import db, User

users = Blueprint("user", __name__)


## ROUTES ##
@users.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("name")
        email = request.form.get('email')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False

        user = User.query.filter_by(username=username).first()
        if not user or not check_password_hash(user.password, password):
            flash('Please check your login details and try again.')
            return redirect(url_for('user.login'))
        login_user(user, remember=remember)
        return redirect(url_for("main.index"))
    else:
        return render_template("login.html")


@users.route("/logout")
@login_required
def logout():
    logout_user()
    # Redirect to home page
    return redirect(url_for("main.index"))


@users.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        email = request.form.get("email")
        username = request.form.get("name")
        password = request.form.get("password")
        admin = request.form.get("admin")

        user = User.query.filter_by(username=username).first()
        if user:
            flash('Username already exists')
            return redirect(url_for("user.login"))

        new_user = User(
            email=email,
            username=username,
            password=generate_password_hash(password),          
        )

        db.session.add(new_user)
        db.session.commit()
        
        # Add ADMIN_CREATED: true to config.yaml
        config_path = current_app.config['BASE_DIR']+"/config.yaml"
        with open(config_path, "a") as config_file:
            config_file.write("ADMIN_CREATED: true\n")

        return redirect(url_for("user.login"))
    else:
        if request.args.get("admin"):
            return render_template("register.html", admin=True)
        else:
            return render_template("register.html")
