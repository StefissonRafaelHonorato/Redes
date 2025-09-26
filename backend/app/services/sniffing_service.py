from scapy.all import sniff, IP, TCP, UDP, ICMP, ARP, Ether, IPv6
from threading import Lock
from collections import defaultdict
from app.config import SERVER_IP

# Estrutura para armazenar dados
traffic_data = defaultdict(lambda: {"Entrada": 0, "Saída": 0, "protocolos": defaultdict(int)})
data_lock = Lock()

def get_protocol(packet):
    """
    Identifica o protocolo do pacote considerando camadas 2 e 3.
    """
    if ARP in packet:
        return "ARP"
    if IPv6 in packet:
        return "IPv6"
    if IP in packet:
        if TCP in packet:
            return "TCP"
        elif UDP in packet:
            return "UDP"
        elif ICMP in packet:
            return "ICMP"
        else:
            return f"IP_PROTO_{packet[IP].proto}"
    if Ether in packet:
        eth_type = packet[Ether].type
        if eth_type == 0x0806:
            return "ARP"
        elif eth_type == 0x0800:
            return "IP"
        elif eth_type == 0x86DD:
            return "IPv6"
        else:
            return f"ETH_TYPE_{hex(eth_type)}"
    return "OUTRO"

def process_packet(packet):
    ip_src = getattr(packet.getlayer(IP), 'src', None)
    ip_dst = getattr(packet.getlayer(IP), 'dst', None)
    if ip_src == SERVER_IP or ip_dst == SERVER_IP:
        direction = "Entrada" if ip_dst == SERVER_IP else "Saída"
        client_ip = ip_src if ip_dst == SERVER_IP else ip_dst
        protocol = get_protocol(packet)
        packet_size = len(packet)
        with data_lock:
            traffic_data[client_ip][direction] += packet_size
            traffic_data[client_ip]["protocolos"][protocol] += packet_size

def start_sniffing():
    sniff(prn=process_packet, store=False)
