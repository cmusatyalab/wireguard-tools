#!/bin/bash
# This script will help you set up and configure wireguard gui.
# You can also follow the instructions in the README.
# You don't need to run this script if you follow the instructions in the README.

# Check for root
if [ "$EUID" -eq 0 ]
  then echo "Please run as a normal user with sudo privileges, not as root. "
  exit
fi

# Update system
sudo apt update
sudo apt-get dist-upgrade -y
sudo apt-get autoremove -y
sudo apt-get autoclean -y

# Check for git
if ! [ -x "$(command -v git)" ]; then
    echo "Error: git is not installed." >&2
    echo "Installing git..."
    sudo apt-get install git -y
fi

cd ~

# clone wireguard gui
git clone https://github.com/radawson/wireguard-gui.git

# install dependencies
sudo apt-get install python3 -y
sudo apt-get install python3-pip -y
cd wireguard-gui
sudo pip3 install -r requirements.txt

# open default ports
sudo ufw allow 22/tcp
sudo ufw allow 5000/tcp
sudo ufw allow 51820/udp

# install wireguard
sudo apt-get install wireguard -y

# configure web server
read -p "Enter IP address for web server (0.0.0.0) for all: " ip
if [ -z "$ip" ]
then
      ip="0.0.0.0"
fi

password=""

while [ -z "$password" ]
do
    read -s -p "Enter sudo password: " password
    echo
    read -s -p "Confirm password: " password2
    echo
    [ "$password" = "$password2" ] && break
    echo "Passwords don't match. Please try again."
    password=""
done

# modify config file
sed -i "s/p
