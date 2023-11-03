from flask import Blueprint 

bp = Blueprint('peers', __name__, url_prefix="/peers")

@bp.route('/')
def peers():
    return "Peers"