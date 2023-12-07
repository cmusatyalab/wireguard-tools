# WireGuard GUI

Welcome to the VPN Setup GUI project. This is a Free and Open Source Software (FOSS) project aimed at helping small VPN operators set up their networks quickly and easily.

## Project Overview

Setting up a VPN can be a complex task, especially for small operators who may not have a dedicated IT team. This project aims to simplify that process by providing a graphical user interface (GUI) for setting up VPN networks.

With this tool, operators can configure their VPN networks without needing to understand complex networking concepts or write configuration files by hand. The GUI provides a simple, intuitive interface that guides operators through the setup process step by step.

We welcome contributions from the community. If you're interested in contributing, please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for more information.

At present, the development roadmap is here [ROADMAP.md](ROADMAP.md)

## Installation

At present, simply clone this repository onto a Linux machine. A Debian-based linux build is the only currently supported OS.

```bash
git clone https://github.com/radawson/wireguard-gui
```

After the repository is cloned, change directory into the wireguard-gui directory

```bash
cd wireguard-gui
```

Next, install the python requirements with

```bash
pip install -r requirements.txt
```

Once the installation is complete, change directory into src.

```bash
cd src
```

Next, Make any adjustments you need to make to config.yaml. Note that the default IP address is localhost, 127.0.0.1. If you want to access the web interface remotely, change this to an appropriate IP address.

***Security warning*** You can also use 0.0.0.0 to listen on all IP addresses, but understand the implications of this.

The one key in config.yaml you MUST change is the SUDO_PASSWORD. This must be the sudo password for the user that will be running the python script. We DO NOT recommend running the entire python web server with sudo. Your user will have to have sudo permission to set up the WireGuard services. If you are only using the datbase for tracking, you could get away without elevating permissions.

```bash
SUDO_PASSWORD: 'changeme'
```

This is also a good time to make sure that your firewall has port 5000 (default) open for the webserver. You will also need to open port 51820 UDP (default) for the WireGuard service.

Examples using ufw:

```bash
sudo ufw allow 5000/tcp
sudo ufw allow 51820/udp
```

Finally, move to the src/ directory and run the program

```bash
python3 run.py
```

The package will install the actual wireguard package after the first time you run the wizard, so be patient on that first run.

## Basic Usage

After you have successfully installed the server, you can navigate to https://[IP Address] and click on "wizard". From here, the fastest way to setup is to type a name and click build.

## Troubleshooting

If you have problems connecting to the web site, first check to make sure you have port 5000 (default) or whichever port you chose open.

The webserver will work on windows, but the automated server setup will only activate on a Debian-based linux system.

## Known Issues

* Too many sudo requests from the user

* New server config names don't rotate properly

## Acknowledgements

We would like to thank Carnegie Mellon University for the WireGuard-Tools code that this project is based on. Their work has been invaluable in helping us get this project off the ground.
