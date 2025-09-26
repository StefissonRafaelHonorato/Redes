from threading import Thread
from time import sleep
from app.services.sniffing_service import traffic_data, data_lock
from app.models.traffic_model import TrafficLog
from app import socketio
from app.db import cursor as db_cursor

def start_reporting_thread():
    def report():
        while True:
            sleep(5)
            with data_lock:
                if not traffic_data:
                    continue
                data_copy = dict(traffic_data)
                traffic_data.clear()
            report_list = []
            for ip, data in data_copy.items():
                log = TrafficLog(ip, data["Entrada"], data["Saída"], dict(data["protocolos"]))
                log.save(db_cursor, log)
                report_list.append(log)
            socketio.emit('traffic_update', {'traffic': [
                {"client_ip": l.client_ip, "inbound": l.inbound, "outbound": l.outbound, "protocols": l.protocols}
                for l in report_list
            ]})

    Thread(target=report, daemon=True).start()
