from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

def test_get_traffic_success(client):
    mock_logs = [
        MagicMock(client_ip="192.168.0.1", inbound=100, outbound=200, protocols={"TCP": 10})
    ]
    
    with patch("app.routes.traffic_routes.TrafficController.aggregate_realtime", return_value=mock_logs):
        response = client.get("/api/traffic")
    
    assert response.status_code == 200
    data = response.get_json()
    assert "traffic" in data
    assert data["traffic"][0]["client_ip"] == "192.168.0.1"

def test_get_historical_invalid_period(client):
    response = client.get("/api/traffic/aggregate?period=invalid")
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == "Período inválido"


def test_get_client_protocols_success(client, mock_db):
    mock_cursor, _ = mock_db
    mock_cursor.fetchone.return_value = ("192.168.0.1", 100, 200, {"TCP": 5}, datetime.now(timezone.utc))

    response = client.get("/api/traffic/protocols/192.168.0.1")
    assert response.status_code == 200
    data = response.get_json()
    assert data["client_ip"] == "192.168.0.1"


def test_get_client_protocols_not_found(client, mock_db):
    mock_cursor, _ = mock_db
    mock_cursor.fetchone.return_value = None

    response = client.get("/api/traffic/protocols/10.0.0.1")
    assert response.status_code == 404
    data = response.get_json()
    assert "Nenhum tráfego encontrado" in data["error"]


def test_get_captures_by_ip_success(client, mock_db):
    mock_cursor, _ = mock_db
    mock_cursor.fetchall.return_value = [
        (376, 358, {"UDP": 734}, datetime.now(timezone.utc))
    ]

    response = client.get("/api/traffic/captures/192.168.0.1?limit=1")
    assert response.status_code == 200
    data = response.get_json()
    assert "captures" in data
    assert data["captures"][0]["inbound"] == 376
    assert data["captures"][0]["outbound"] == 358
    assert data["captures"][0]["protocols"] == {"UDP": 734}

