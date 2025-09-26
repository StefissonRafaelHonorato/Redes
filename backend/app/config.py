import os
from dotenv import load_dotenv

load_dotenv()

SERVER_IP = os.getenv("SERVER_IP")
DATABASE_URL = os.getenv("DATABASE_URL")

if not SERVER_IP:
    raise RuntimeError("Defina a variável SERVER_IP no .env")
