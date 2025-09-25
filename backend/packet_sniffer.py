from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
import threading, time
from collections import defaultdict
from scapy.all import sniff, IP, TCP, UDP, conf
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

SERVER_IP = os.getenv("SERVER_IP")
if not SERVER_IP:
    print("!!! ATENÇÃO: Defina a variável SERVER_IP no .env")
    exit(1)

# Estrutura para armazenar dados de tráfego
traffic_data = defaultdict(lambda: {"Entrada": 0, "Saída": 0, "protocolos": defaultdict(int)})
data_lock = threading.Lock()


def process_packet(packet):
    """Processa cada pacote capturado e atualiza a estrutura de tráfego"""
    if IP in packet:
        ip_src, ip_dst, packet_size = packet[IP].src, packet[IP].dst, len(packet)
        if ip_src == SERVER_IP or ip_dst == SERVER_IP:
            direction = "Entrada" if ip_dst == SERVER_IP else "Saída"
            client_ip = ip_src if ip_dst == SERVER_IP else ip_dst
            protocol = "TCP" if TCP in packet else "UDP" if UDP in packet else "OUTRO"
            with data_lock:
                traffic_data[client_ip][direction] += packet_size
                traffic_data[client_ip]["protocolos"][protocol] += packet_size


def generate_report():
    """Gera relatórios a cada 5 segundos e envia via WebSocket"""
    while True:
        time.sleep(5)
        with data_lock:
            if not traffic_data:
                continue
            data_copy = traffic_data.copy()
            traffic_data.clear()

        report = []
        for ip, data in data_copy.items():
            report.append({
                "client_ip": ip,
                "inbound": data["Entrada"],
                "outbound": data["Saída"],
                "protocols": dict(data["protocolos"])
            })
        
        # Ordena pelos IPs que mais trafegaram
        report.sort(key=lambda x: x["inbound"] + x["outbound"], reverse=True)

        # Emite via WebSocket
        socketio.emit('traffic_update', {'traffic': report})


@app.route('/')
def index():
    return "Servidor rodando com WebSocket!"


def start_sniffing_thread():
    """Thread para captura de pacotes"""
    try:
        if conf.L2listen is None:
            print("AVISO: L2 não disponível, usando L3 socket")
        sniff(filter="ip", prn=process_packet, store=False)
    except PermissionError:
        print("ERRO: Permissão negada. Execute como administrador/root.")
        exit(1)
    except Exception as e:
        print(f"Erro inesperado na captura: {e}")
        exit(1)


if __name__ == "__main__":
    # Thread de sniffing
    sniffer_thread = threading.Thread(target=start_sniffing_thread, daemon=True)
    sniffer_thread.start()

    # Thread de geração de relatórios
    report_thread = threading.Thread(target=generate_report, daemon=True)
    report_thread.start()

    # Inicia o Flask com WebSocket
    print(f"Servidor WebSocket rodando em http://127.0.0.1:5000")
    socketio.run(app, host='0.0.0.0', port=5000)
