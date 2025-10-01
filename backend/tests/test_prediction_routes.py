from datetime import datetime


def test_get_predictions_success(client, mock_db):
    mock_cursor, _ = mock_db
    mock_cursor.fetchall.return_value = [
        ("192.168.0.1", "normal", 0.95, datetime.utcnow())
    ]

    response = client.get("/api/prediction?limit=5")
    assert response.status_code == 200
    data = response.get_json()
    assert data[0]["client_ip"] == "192.168.0.1"
    assert isinstance(data[0]["probability"], float)


def test_get_prediction_by_ip_success(client, mock_db):
    mock_cursor, _ = mock_db
    mock_cursor.fetchone.return_value = ("192.168.0.1", "normal", 0.85, datetime.utcnow())

    response = client.get("/api/prediction/192.168.0.1")
    assert response.status_code == 200
    data = response.get_json()
    assert data["client_ip"] == "192.168.0.1"


def test_get_prediction_by_ip_not_found(client, mock_db):
    mock_cursor, _ = mock_db
    mock_cursor.fetchone.return_value = None

    response = client.get("/api/prediction/10.0.0.1")
    assert response.status_code == 404
    data = response.get_json()
    assert "Nenhuma previsão encontrada" in data["error"]


def test_run_prediction_success(client, mock_db):
    mock_cursor, _ = mock_db

    # histórico fake para treinar regressão
    mock_cursor.fetchall.return_value = [
        (100, 50, datetime.utcnow()),
        (120, 60, datetime.utcnow()),
    ]

    response = client.post("/api/prediction/run", json={"client_ip": "192.168.0.1"})
    assert response.status_code == 200
    data = response.get_json()
    assert data["client_ip"] == "192.168.0.1"
    assert "prediction" in data
    assert "probability" in data


def test_run_prediction_no_ip_available(client):
    response = client.post("/api/prediction/run", json={})
    assert response.status_code == 404
    data = response.get_json()
    assert "No client IP available" in data["error"]
