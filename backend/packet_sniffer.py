# backend
import sys
import time
import threading
from collections import defaultdict
from scapy.all import sniff, IP, TCP, UDP
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

SERVER_IP = "172.27.0.14"

traffic_data = defaultdict(lambda: {"Entrada": 0, "Saída": 0, "protocolos": defaultdict(int)})
latest_report = {}
data_lock = threading.Lock()

def process_packet(packet):
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
    global latest_report
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
        
        report.sort(key=lambda x: x["inbound"] + x["outbound"], reverse=True)
        latest_report = {"traffic": report}
        print(f"Relatório gerado às {time.strftime('%H:%M:%S')} com {len(report)} clientes.")

@app.route('/api/traffic_data')
def get_traffic_data():
    return jsonify(latest_report)

def start_sniffing_thread():
    print(f"Iniciando a captura de pacotes no servidor {SERVER_IP}...")
    try:
        sniff(filter="ip", prn=process_packet, store=False)
    except PermissionError:
        print("\nERRO: Permissão negada para capturar pacotes. Tente executar como administrador/root.")
        sys.exit(1)
    except Exception as e:
        print(f"Ocorreu um erro inesperado na captura: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if SERVER_IP == "SEU_IP_AQUI": 
        print("!!! ATENÇÃO: Por favor, edite o arquivo e defina a variável SERVER_IP.")
    else:
        sniffer_thread = threading.Thread(target=start_sniffing_thread, daemon=True)
        sniffer_thread.start()
        
        report_thread = threading.Thread(target=generate_report, daemon=True)
        report_thread.start()
        
        print("Servidor da API iniciado em http://127.0.0.1:5000")
        print("Acesse http://127.0.0.1:5000/api/traffic_data para ver os dados.")
        app.run(debug=False)