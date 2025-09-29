from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from app.routes import traffic_routes, prediction_routes

socketio = SocketIO(cors_allowed_origins="*")

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(traffic_routes.bp)
    app.register_blueprint(prediction_routes.bp)

    socketio.init_app(app)

    return app
