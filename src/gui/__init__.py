from flask import Flask, render_template, request, redirect, url_for, flash
import datetime

def create_app():
    app = Flask(__name__)

    @app.route('/')
    def index():
        return render_template('index.html', utc_dt=datetime.datetime.utcnow())
    
    @app.route('/about')
    def about():
        return render_template('about.html', utc_dt=datetime.datetime.utcnow())
    
    @app.route('/dashboard')
    def dashboard():
        return render_template('dashboard.html', utc_dt=datetime.datetime.utcnow())
    
    from . import network
    app.register_blueprint(network.bp)

    from . import peer
    app.register_blueprint(peer.bp)

    from . import setting
    app.register_blueprint(setting.bp)

    return app

if __name__ == 'main':
    #app.run(debug = True)
    pass