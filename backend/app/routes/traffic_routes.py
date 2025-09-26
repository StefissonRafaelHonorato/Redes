from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from app.controllers.traffic_controller import TrafficController
from app.models.traffic_model import TrafficLog
from app.db import cursor as db_cursor

bp = Blueprint('traffic', __name__)

@bp.route('/api/traffic', methods=['GET'])
def get_traffic():
    # Retorna os dados em tempo real
    report = TrafficController.aggregate_traffic()
    result = [{
        "client_ip": log.client_ip,
        "inbound": log.inbound,
        "outbound": log.outbound,
        "protocols": log.protocols
    } for log in report]
    return jsonify({"traffic": result})

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

    db_cursor.execute(
        "SELECT id, client_ip, inbound, outbound, protocols, created_at FROM traffic_logs WHERE created_at >= %s",
        (since,)
    )
    rows = db_cursor.fetchall()

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
