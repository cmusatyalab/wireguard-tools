#!/usr/bin/env python3
import yaml
from gui import create_app

app = create_app()

if __name__ == "__main__":
    # Read config.yaml
    with open("config.yaml") as f:
        config = yaml.safe_load(f)
    # Start the Flask application using host_ip and port from config.yaml
    host_ip = config["HOST_IP"]
    port = config["HOST_PORT"]
    print(f" * Starting in {config['MODE']} mode")
    app.run(host=host_ip, port=port, debug=True, ssl_context=(f"{app.config['PKI_CERT_PATH']}/{app.config['PKI_CERT']}", f"{app.config['PKI_CERT_PATH']}/{app.config['PKI_KEY']}"))
