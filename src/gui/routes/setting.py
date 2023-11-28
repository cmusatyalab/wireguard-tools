from flask import Blueprint, render_template, redirect, url_for
from ..models import db, Config, Network, Peer, config_load_test_db,network_load_test_db,peer_load_test_db

settings = Blueprint('settings', __name__, url_prefix="/settings")

@settings.route('/')
def settings_detail():
    return render_template('settings.html')

@settings.route('/test_db')
def test_db_entries():
    config_load_test_db()
    network_load_test_db()
    peer_load_test_db()
    message = "Database entries loaded successfully!"
    return render_template('settings.html', message=message)

@settings.route('/purge_db', methods=['POST'])
def purge_db():
    db.session.query(Config).delete()
    db.session.query(Peer).delete()
    db.session.query(Network).delete()
    db.session.commit()
    return render_template('settings.html', message="Database purged successfully")