from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from app.db import get_connection
import numpy as np
from sklearn.linear_model import LinearRegression

bp = Blueprint('prediction', __name__)

# 🔹 Rota: buscar previsões recentes (histórico de predições)
@bp.route('/api/prediction', methods=['GET'])
def get_predictions():
    try:
        limit = int(request.args.get('limit', 50))

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT client_ip, prediction, probability, created_at "
                    "FROM predictions ORDER BY created_at DESC LIMIT %s",
                    (limit,)
                )
                rows = cursor.fetchall()

        predictions = [
            {
                "client_ip": row[0],
                "prediction": row[1],
                "probability": float(row[2]),
                "timestamp": row[3].isoformat()
            }
            for row in rows
        ]

        return jsonify(predictions)

    except Exception as e:
        print("Erro ao buscar previsões:", e)
        return jsonify({"error": str(e)}), 500


# 🔹 Rota: buscar previsão por IP
@bp.route('/api/prediction/<ip>', methods=['GET'])
def get_prediction_by_ip(ip):
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT client_ip, prediction, probability, created_at "
                    "FROM predictions WHERE client_ip = %s "
                    "ORDER BY created_at DESC LIMIT 1",
                    (ip,)
                )
                row = cursor.fetchone()

        if not row:
            return jsonify({"error": f"Nenhuma previsão encontrada para o IP {ip}"}), 404

        result = {
            "client_ip": row[0],
            "prediction": row[1],
            "probability": float(row[2]),
            "timestamp": row[3].isoformat()
        }

        return jsonify(result)

    except Exception as e:
        print(f"Erro ao buscar previsão do IP {ip}:", e)
        return jsonify({"error": str(e)}), 500


# 🔹 Rota: rodar previsão sob demanda (exemplo usando regressão linear simples)
@bp.route('/api/prediction/run', methods=['POST'])
def run_prediction():
    try:
        data = request.json
        client_ip = data.get("client_ip")
        features = data.get("features", {})

        if not client_ip:
            # pegar o primeiro IP do traffic_logs ou outro critério
            cursor.execute("SELECT DISTINCT client_ip FROM traffic_logs LIMIT 1")
            row_ip = cursor.fetchone()
            if not row_ip:
                return jsonify({"error": "Não há IPs para rodar predição"}), 404
            client_ip = row_ip[0]

        # exemplo: vamos usar o histórico do IP para treinar regressão
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT inbound, outbound, created_at "
                    "FROM traffic_logs WHERE client_ip = %s "
                    "ORDER BY created_at DESC LIMIT 20",
                    (client_ip,)
                )
                rows = cursor.fetchall()

        if not rows:
            return jsonify({"error": f"Nenhum dado para previsão do IP {client_ip}"}), 404

        inbound = [r[0] for r in rows][::-1]
        outbound = [r[1] for r in rows][::-1]
        timestamps = [i for i in range(len(rows))]

        X = np.array(timestamps).reshape(-1, 1)

        model_in = LinearRegression().fit(X, inbound)
        model_out = LinearRegression().fit(X, outbound)

        next_index = np.array([[len(rows)]])
        inbound_pred = model_in.predict(next_index)[0]
        outbound_pred = model_out.predict(next_index)[0]

        result = {
            "client_ip": client_ip,
            "prediction": "suspeito" if inbound_pred > 1000 else "normal",  # 👈 regra de exemplo
            "probability": float(abs(inbound_pred) / (abs(inbound_pred) + abs(outbound_pred) + 1)),
            "timestamp": datetime.utcnow().isoformat()
        }

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO predictions (client_ip, prediction, probability, created_at) "
                    "VALUES (%s, %s, %s, %s)",
                    (client_ip, result["prediction"], result["probability"], datetime.utcnow())
                )
                conn.commit()


        return jsonify(result)

    except Exception as e:
        print("Erro ao rodar previsão:", e)
        return jsonify({"error": str(e)}), 500
