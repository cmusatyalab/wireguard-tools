from flask import Blueprint, current_app, flash, redirect, render_template, url_for
from flask_login import current_user, login_required
from gui.models import Peer

dashboard = Blueprint('dashboard', __name__, url_prefix="/dashboard")

## FUNCTIONS ##
def get_peer_count():
    return Peer.query.count()

def get_active_peer_count():
    return Peer.query.filter_by(active=True).count()

def get_inactive_peer_count():
    return Peer.query.filter_by(active=False).count()

def get_lighthouse_count():
    return Peer.query.filter_by(lighthouse=True).count()

def get_orphan_count():
    return Peer.query.filter_by(network=0).count()

## ROUTES ##

@dashboard.route("/")
@login_required
def index():
    active = get_active_peer_count()
    inactive = get_inactive_peer_count() - get_orphan_count()
    lighthouse = get_lighthouse_count()
    orphan = get_orphan_count()
    
    peer_data = {
        "orphan": orphan,
        "active": active,
        "inactive": inactive,
        "lighthouse": lighthouse,
        
    }
    message = "Dashboard widgets are under construction"
    flash(message, "info")
    return render_template("dashboard.html", peers=peer_data)