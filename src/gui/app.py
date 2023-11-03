from flask import Flask, render_template, request, redirect, url_for, flash
import datetime

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html', utc_dt=datetime.datetime.utcnow())
