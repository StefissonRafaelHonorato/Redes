from threading import Thread
from app import create_app, socketio
from app.services.sniffing_service import start_sniffing
from app.services.reporting_service import start_reporting_thread

app = create_app()

if __name__ == "__main__":
    # Inicia sniffing e reporting em threads normais
    Thread(target=start_sniffing, daemon=True).start()
    start_reporting_thread()  # já cria thread internamente

    # Roda o servidor SocketIO
    socketio.run(app, host="0.0.0.0", port=5000, use_reloader=False)
