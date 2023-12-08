from flask import Blueprint, current_app, flash, render_template, redirect, request, url_for
from flask_login import login_required
from ..models import db, Config, Network, Peer, config_load_test_db,network_load_test_db,peer_load_test_db

settings = Blueprint('settings', __name__, url_prefix="/settings")

@settings.route('/', methods=['GET','POST'])
@login_required
def settings_detail():
    if request.method == 'POST':
        for key, value in request.form.items():
            current_app.config[key] = value
        
    return render_template('settings.html', config=current_app.config)

@settings.route('/test_db')
@login_required
def test_db_entries():
    config_load_test_db()
    network_load_test_db()
    peer_load_test_db()
    message = "Database entries loaded successfully!"
    flash(message, "success")
    return render_template('settings.html')

@settings.route('/purge_db', methods=['POST'])
@login_required
def purge_db():
    db.session.query(Config).delete()
    db.session.query(Peer).delete()
    db.session.query(Network).delete()
    db.session.commit()
    message = "Database purged successfully!"
    flash(message, "success")
    return render_template('settings.html')