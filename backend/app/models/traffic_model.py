from psycopg2.extras import Json

class TrafficLog:
    def __init__(self, client_ip, inbound, outbound, protocols):
        self.client_ip = client_ip
        self.inbound = inbound
        self.outbound = outbound
        self.protocols = protocols

    @staticmethod
    def save(cursor, log):
        try:
            cursor.execute(
                """
                INSERT INTO traffic_logs (client_ip, inbound, outbound, protocols)
                VALUES (%s, %s, %s, %s)
                """,
                (log.client_ip, log.inbound, log.outbound, Json(log.protocols))
            )
        except Exception as e:
            print(f"Erro ao salvar no banco: {e}")
