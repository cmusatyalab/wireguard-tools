from flask import Blueprint, redirect, render_template, request, url_for

users = Blueprint("user", __name__)


## ROUTES ##
@users.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        return redirect(url_for("index"))
    else:
        return render_template("login.html")


@users.route("/logout")
# @login_required
def logout():
    # logout_user()
    # Redirect to home page
    return redirect(url_for("index"))
