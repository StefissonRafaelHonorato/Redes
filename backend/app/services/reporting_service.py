from threading import Thread
from time import sleep
from app.services.sniffing_service import traffic_data, data_lock
from app.models.traffic_model import TrafficLog
from app import socketio
from app.db import get_connection

def start_reporting_thread():
    def report():
        while True:
            sleep(5)

            # Faz uma cópia segura dos dados e limpa o buffer
            with data_lock:
                if not traffic_data:
                    continue
                data_copy = dict(traffic_data)
                traffic_data.clear()

            report_list = []

            # Insere dados no banco
            try:
                with get_connection() as conn:
                    with conn.cursor() as cursor:
                        for ip, data in data_copy.items():
                            log = TrafficLog(ip, data["Entrada"], data["Saída"], dict(data["protocolos"]))
                            log.save(cursor, log)  # use cursor local
                            report_list.append(log)
            except Exception as e:
                print("Erro ao salvar tráfego no banco:", e)
                continue

            # Emite os dados via SocketIO
            socketio.emit('traffic_update', {'traffic': [
                {"client_ip": l.client_ip, "inbound": l.inbound, "outbound": l.outbound, "protocols": l.protocols}
                for l in report_list
            ]})

    Thread(target=report, daemon=True).start()
