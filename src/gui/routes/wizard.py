from flask import Blueprint, render_template, redirect, url_for, request
from ..models import db, Config, Network, Peer, config_load_test_db,network_load_test_db,peer_load_test_db

wizard = Blueprint('wizard', __name__, url_prefix="/wizard")

@wizard.route('/setup', methods=['GET', 'POST'])
def setup():
    if request.method == 'GET':
        return render_template('wizard_setup.html')
