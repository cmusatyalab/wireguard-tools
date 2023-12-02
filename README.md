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

Next, install the requirements with

```bash
    pip install -r requirements.txt
```

Next, Make any adjustments you need to make to config.yaml. Note that the default IP address is localhost, 127.0.0.1. If you want to access the web interface remotely, change this to an appropriate IP address.

Finally, move to the src/ directory and run the program

```bash
    cd src
    python3 run.py
```

## Troubleshooting

If you have problems connecting to the web site, first check to make sure you have port 5000 (default) or whichever port you chose open.

The webserver will work on windows, but the automated server setup will only activate on a Debian-based linux system.

## Acknowledgements

We would like to thank Carnegie Mellon University for the WireGuard-Tools code that this project is based on. Their work has been invaluable in helping us get this project off the ground.
