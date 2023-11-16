from flask import Blueprint, render_template

settings = Blueprint('settings', __name__, url_prefix="/settings")

@settings.route('/')
def settings_detail():
    return render_template('settings.html')