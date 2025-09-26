import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("Defina a variável DATABASE_URL no .env")

# Conexão com autocommit
conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cursor = conn.cursor()
