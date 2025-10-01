from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from app.db import get_connection
import numpy as np
from sklearn.linear_model import LinearRegression
import statistics
from statsmodels.tsa.arima.model import ARIMA

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


# 🔹 Rota: rodar detecção de anomalia (substituindo a regressão)
@bp.route('/api/prediction/run', methods=['POST'])
def run_prediction():
    try:
        data = request.json
        client_ip = data.get("client_ip")
        if not client_ip:
            return jsonify({"error": "No client IP available"}), 400

        with get_connection() as conn:
            with conn.cursor() as cursor:
                # 1. Obter o registro de tráfego mais recente para ser analisado
                cursor.execute(
                    "SELECT inbound, outbound FROM traffic_logs WHERE client_ip = %s "
                    "ORDER BY created_at DESC LIMIT 1",
                    (client_ip,)
                )
                latest_traffic = cursor.fetchone()
                if not latest_traffic:
                    return jsonify({"error": f"Nenhum dado de tráfego encontrado para o IP {client_ip}"}), 404
                
                current_inbound, current_outbound = latest_traffic

                # 2. Obter o histórico de tráfego para construir o baseline (perfil normal)
                # Usamos um período maior (ex: 100 registros) para um baseline mais estável.
                cursor.execute(
                    "SELECT inbound FROM traffic_logs WHERE client_ip = %s "
                    "ORDER BY created_at DESC LIMIT 100",
                    (client_ip,)
                )
                # Extrai apenas o valor de 'inbound' de cada linha
                historical_inbound = [row[0] for row in cursor.fetchall()]
        
        # Garante que temos dados suficientes para o cálculo estatístico
        if len(historical_inbound) < 10:
             return jsonify({"error": f"Dados históricos insuficientes para o IP {client_ip}"}), 400

        # 3. Calcular o baseline: média e desvio padrão do tráfego histórico
        mean_inbound = statistics.mean(historical_inbound)
        std_dev_inbound = statistics.stdev(historical_inbound)
        
        # 4. Aplicar a regra estatística para detecção de anomalia
        # Define um limiar (threshold). 3 desvios padrão é um valor comum.
        threshold = mean_inbound + (3 * std_dev_inbound)
        
        # O tráfego é "suspeito" se o valor atual exceder significativamente o baseline
        is_suspicious = current_inbound > threshold

        # 5. Calcular um "score de anomalia" em vez de uma falsa probabilidade
        # Usamos o Z-score, que mede quantos desvios padrão o ponto atual está da média.
        # Adicionamos 1e-9 para evitar divisão por zero se o desvio padrão for 0.
        anomaly_score = 0.0
        if std_dev_inbound > 0:
            z_score = (current_inbound - mean_inbound) / std_dev_inbound
            # Normaliza o score para ficar aproximadamente entre 0 e 1, onde valores altos são mais anômalos
            anomaly_score = 1 / (1 + np.exp(-z_score)) 
        
        # Monta o resultado final
        result = {
            "client_ip": client_ip,
            "prediction": "suspeito" if is_suspicious else "normal",
            "probability": float(anomaly_score),  # Agora é um score de anomalia, não uma proporção
            "timestamp": datetime.utcnow().isoformat()
        }

        # Salva a nova predição no banco de dados
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
        print("Erro ao rodar detecção de anomalia:", e)
        return jsonify({"error": str(e)}), 500
    
    # 🔹 Rota: Prever o próximo valor de tráfego para um IP
@bp.route('/api/prediction/forecast', methods=['POST'])
def forecast_traffic():
    try:
        data = request.json
        client_ip = data.get("client_ip")
        if not client_ip:
            return jsonify({"error": "client_ip é obrigatório"}), 400

        # 1. Coletar dados históricos (ex: últimos 50 registros)
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT inbound FROM traffic_logs WHERE client_ip = %s "
                    "ORDER BY created_at ASC LIMIT 50",  # ASC para manter a ordem cronológica
                    (client_ip,)
                )
                # Pega apenas o valor de inbound de cada linha
                historical_inbound = [row[0] for row in cursor.fetchall()]

        if len(historical_inbound) < 2:
            return jsonify({"error": "Dados insuficientes para previsão"}), 404

        # 2. Preparar os dados para o modelo
        # X é a sequência de tempo (0, 1, 2, ...)
        X = np.array(range(len(historical_inbound))).reshape(-1, 1)
        # y é o valor que queremos prever (tamanho do tráfego de entrada)
        y = np.array(historical_inbound)

        # 3. Treinar o modelo de Regressão Linear
        model = LinearRegression()
        model.fit(X, y)

        # 4. Fazer a previsão para o próximo ponto no tempo
        next_time_step = np.array([[len(historical_inbound)]])
        predicted_value = model.predict(next_time_step)[0]
        
        # Garante que a predição não seja negativa
        predicted_value = max(0, predicted_value)

        # 5. Retornar o resultado
        result = {
            "client_ip": client_ip,
            "forecast_timestamp": (datetime.utcnow() + timedelta(seconds=5)).isoformat(), # Ex: prevendo para os próximos 5s
            "predicted_inbound_size": float(predicted_value),
            "unit": "bytes" ,# É importante informar a unidade,
            "model_used": "LinearRegression"
        }

        with get_connection() as conn:
            with conn.cursor() as cursor:
                # Inserindo na nova tabela 'forecasts'
                cursor.execute(
                    "INSERT INTO forecasts (client_ip, predicted_value, model_used, created_at) "
                    "VALUES (%s, %s, %s, %s)",
                    (
                        result["client_ip"],
                        result["predicted_inbound_size"],
                        result["model_used"],
                        datetime.utcnow()
                    )
                )
                conn.commit()

        return jsonify(result)

    except Exception as e:
        print("Erro na previsão de tráfego:", e)
        return jsonify({"error": str(e)}), 500
    
# 🔹 Rota: Prever o próximo valor de tráfego com ARIMA (RECOMENDADO)
@bp.route('/api/prediction/forecast-arima', methods=['POST'])
def forecast_traffic_arima():
    try:
        data = request.json
        client_ip = data.get("client_ip")
        if not client_ip:
            return jsonify({"error": "client_ip é obrigatório"}), 400

        # 1. Coletar dados históricos
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT inbound FROM traffic_logs WHERE client_ip = %s "
                    "ORDER BY created_at ASC LIMIT 50",
                    (client_ip,)
                )
                historical_inbound = [row[0] for row in cursor.fetchall()]

        if len(historical_inbound) < 10: # ARIMA precisa de um pouco mais de dados
            return jsonify({"error": "Dados insuficientes para previsão com ARIMA"}), 404

        # 2. Treinar o modelo ARIMA
        # O parâmetro 'order=(p, d, q)' define o comportamento do modelo.
        # (5, 1, 0) é um ponto de partida comum:
        # p=5: usa os 5 últimos valores para prever o próximo
        # d=1: diferencia os dados para torná-los estacionários (remove tendência)
        # q=0: não usa a média móvel dos erros
        model = ARIMA(historical_inbound, order=(5, 1, 0))
        model_fit = model.fit()

        # 3. Fazer a previsão para o próximo ponto no tempo (1 passo à frente)
        forecast = model_fit.forecast(steps=1)
        predicted_value = forecast[0]

        # Garante que a predição não seja negativa
        predicted_value = max(0, predicted_value)

        # 4. Retornar o resultado
        result = {
            "client_ip": client_ip,
            "forecast_timestamp": (datetime.utcnow() + timedelta(seconds=5)).isoformat(),
            "predicted_inbound_size": float(predicted_value),
            "unit": "bytes",
            "model_used": "ARIMA"
        }

        # ----------------------------------------------------
        # ▼▼▼ NOVO BLOCO PARA SALVAR NO BANCO DE DADOS ▼▼▼
        # ----------------------------------------------------
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # Inserindo na nova tabela 'forecasts'
                cursor.execute(
                    "INSERT INTO forecasts (client_ip, predicted_value, model_used, created_at) "
                    "VALUES (%s, %s, %s, %s)",
                    (
                        result["client_ip"],
                        result["predicted_inbound_size"],
                        result["model_used"],
                        datetime.utcnow()
                    )
                )
                conn.commit()
        # ----------------------------------------------------
        # ▲▲▲ FIM DO NOVO BLOCO ▲▲▲
        # ----------------------------------------------------

        return jsonify(result)

    except Exception as e:
        print("Erro na previsão de tráfego com ARIMA:", e)
        return jsonify({"error": str(e)}), 500