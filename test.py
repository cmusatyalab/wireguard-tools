#!/usr/bin/python3

# TODO: Remove this file after dev testing is complete

import re
import sys


def parse_wg_output(output):
    output_lines = output.split("\n")
    peers_data = {}
    current_peer = None

    for line in output_lines:
        peer_match = re.match(r"\s*peer: (\S+)", line)
        endpoint_match = re.match(r"\s*endpoint: (\S+):(\d+)", line)
        allowed_ips_match = re.match(r"\s*allowed ips: (\S+)", line)
        transfer_match = re.match(r"\s*transfer: (\S+)", line)
        handshake_match = re.match(r"\s*latest handshake: (.+ ago)", line)

        if peer_match:
            current_peer = peer_match.group(1)
            peers_data[current_peer] = {}
        elif endpoint_match and current_peer:
            peers_data[current_peer]["endpoint"] = endpoint_match.group(1)
            peers_data[current_peer]["endpoint_port"] = endpoint_match.group(2)
        elif allowed_ips_match and current_peer:
            peers_data[current_peer]["allowed_ips"] = allowed_ips_match.group(1)
        elif transfer_match and current_peer:
            transfer_data = transfer_match.group(1).split("/")
            if len(transfer_data) >= 2:
                peers_data[current_peer]["transfer_rx"] = transfer_data[0]
                peers_data[current_peer]["transfer_tx"] = transfer_data[1]
        elif handshake_match and current_peer:
            time_str = handshake_match.group(1)
            days, hours, minutes, seconds = map(int, re.findall(r"\d+", time_str))
            total_seconds = days * 86400 + hours * 3600 + minutes * 60 + seconds
            peers_data[current_peer]["latest_handshake"] = total_seconds

    return peers_data


if __name__ == "__main__":
    stdin_input = sys.stdin.read()
    print(parse_wg_output(stdin_input))
