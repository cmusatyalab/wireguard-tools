import yaml
from gui import create_app

app = create_app()

if __name__ == "__main__":
    # Read config.yaml
    with open('config.yaml') as f:
        config = yaml.safe_load(f)
    # Start the Flask application using host_ip and port from config.yaml
    host_ip = config['HOST_IP']
    port = config['PORT']
    app.run(host=host_ip, port=port, debug=True)