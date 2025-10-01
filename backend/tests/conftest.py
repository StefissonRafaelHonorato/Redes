import pytest
from unittest.mock import MagicMock, patch
from app import create_app

# 🔹 Cria app Flask para os testes
@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
    })
    return app

# 🔹 Cliente de teste Flask
@pytest.fixture
def client(app):
    return app.test_client()

# 🔹 Fixture para mockar o banco
@pytest.fixture
def mock_db(monkeypatch):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    mock_conn.cursor.return_value.__exit__.return_value = None

    # 🔹 Força app.db.get_connection a sempre usar o mock
    monkeypatch.setattr("app.db.get_connection", lambda: mock_conn)

    return mock_cursor, mock_conn

# 🔹 Fixture para mockar objetos sem precisar instalar plugin extra
@pytest.fixture
def mocker(monkeypatch):
    class Mocker:
        def patch(self, target, new=None):
            return monkeypatch.setattr(target, new)

    return Mocker()

@pytest.fixture
def mock_get_connection(monkeypatch):
    def _mock(rows=None, fetchone=None):
        mock_cursor = MagicMock()
        if rows is not None:
            mock_cursor.fetchall.return_value = rows
        if fetchone is not None:
            mock_cursor.fetchone.return_value = fetchone
        mock_conn = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        monkeypatch.setattr("app.routes.traffic_routes.get_connection", lambda: mock_conn)
        return mock_cursor, mock_conn
    return _mock
