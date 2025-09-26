from app.models.traffic_model import TrafficLog
from app.services.sniffing_service import traffic_data, data_lock

class TrafficController:
    @staticmethod
    def aggregate_realtime():
        with data_lock:
            data_copy = dict(traffic_data)
        report = []
        for ip, data in data_copy.items():
            report.append(TrafficLog(ip, data["Entrada"], data["Saída"], dict(data["protocolos"])))
        report.sort(key=lambda x: x.inbound + x.outbound, reverse=True)
        return report
