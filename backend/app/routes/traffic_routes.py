from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from app.controllers.traffic_controller import TrafficController
from app.db import get_connection

bp = Blueprint('traffic', __name__)

# Rota em tempo real (já depende do TrafficController)
@bp.route('/api/traffic', methods=['GET'])
def get_traffic():
    report = TrafficController.aggregate_realtime()
    result = [{
        "client_ip": log.client_ip,
        "inbound": log.inbound,
        "outbound": log.outbound,
        "protocols": log.protocols
    } for log in report]
    return jsonify({"traffic": result})

# Rota de histórico
@bp.route('/api/traffic/aggregate', methods=['GET'])
def get_historical():
    period = request.args.get('period', 'minute')
    now = datetime.utcnow()

    delta_map = {
        'minute': timedelta(minutes=1),
        'hour': timedelta(hours=1),
        'day': timedelta(days=1),
        'week': timedelta(weeks=1)
    }

    if period not in delta_map:
        return jsonify({"error": "Período inválido"}), 400

    since = now - delta_map[period]

    try:
        # cria conexão e cursor local para cada request
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id, client_ip, inbound, outbound, protocols, created_at "
                    "FROM traffic_logs WHERE created_at >= %s",
                    (since,)
                )
                rows = cursor.fetchall()

        traffic_data = []
        for row in rows:
            traffic_data.append({
                "id": row[0],
                "client_ip": row[1],
                "inbound": row[2],
                "outbound": row[3],
                "protocols": row[4],
                "timestamp": row[5].isoformat()
            })

        return jsonify({"traffic": traffic_data})

    except Exception as e:
        print("Erro ao buscar histórico:", e)
        return jsonify({"error": str(e)}), 500

# Rota de protocolos de um IP específico
@bp.route('/api/traffic/protocols/<ip>', methods=['GET'])
def get_client_protocols(ip):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT client_ip, inbound, outbound, protocols, created_at "
                    "FROM traffic_logs WHERE client_ip = %s "
                    "ORDER BY created_at DESC LIMIT 1",
                    (ip,)
                )
                row = cursor.fetchone()

        if not row:
            return jsonify({"error": f"Nenhum tráfego encontrado para o IP {ip}"}), 404

        result = {
            "client_ip": row[0],
            "inbound": row[1],
            "outbound": row[2],
            "protocols": row[3],
            "created_at": row[4].isoformat()
        }

        return jsonify(result)

    except Exception as e:
        print(f"Erro ao buscar protocolos do IP {ip}:", e)
        return jsonify({"error": str(e)}), 500

@bp.route('/api/traffic/captures/<ip>', methods=['GET'])
def get_captures_by_ip(ip):
    try:
        limit = int(request.args.get('limit', 50))
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT inbound, outbound, protocols, created_at "
                    "FROM traffic_logs WHERE client_ip = %s "
                    "ORDER BY created_at DESC LIMIT %s",
                    (ip, limit)
                )
                rows = cursor.fetchall()

        if not rows:
            return jsonify({"captures": []})

        captures = []
        for r in rows:
            captures.append({
                "inbound": r[0],
                "outbound": r[1],
                "protocols": r[2],               # assumindo JSON/JSONB
                "created_at": r[3].isoformat()
            })

        return jsonify({"captures": captures})

    except Exception as e:
        print("Erro ao buscar captures:", e)
        return jsonify({"error": str(e)}), 500
