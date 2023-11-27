from flask import Blueprint, current_app, render_template, redirect, url_for, request
from ..models import db, Config, Network, Peer

wizard = Blueprint('wizard', __name__, url_prefix="/wizard")

@wizard.route('/setup', methods=['GET', 'POST'])
def setup():
    defaults = {
        'base_ip': current_app.config['BASE_IP'],
        'base_po'
        'dns': current_app.config['DNS'],

    } 
    if request.method == 'GET':
        return render_template('wizard_setup.html', defaults=defaults)
    elif request.method == 'POST':
        # Get the form data
        name = request.form['name']
        description = request.form['description']
        private_key = request.form['private_key']
        base_ip = request.form['base_ip']
        dns = request.form['dns']
        peer_config = request.form['peer_config']

        # Create a new network object
        new_network = Network(
            name=name,
            description=description,
            private_key=private_key,
            base_ip=base_ip,
            dns=dns,
            peer_config=peer_config,
        )

        # Add the new network to the database
        db.session.add(new_network)
        db.session.commit()

        # Create a new peer object
        new_peer = Peer(
            name=name,
            private_key=private_key,
            address=peer_config['address'],
            dns=dns,
            network=new_network.id,
            description=description,
        )

        # Add the new peer to the database
        db.session.add(new_peer)
        db.session.commit()

        # Redirect to the peers page
        return redirect(url_for('network.networks_all'))
