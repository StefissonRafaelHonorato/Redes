import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("Defina a variável DATABASE_URL no .env")

# Função para criar conexão
def get_connection():
    return psycopg2.connect(DATABASE_URL, sslmode="require")

# Função para executar query e retornar resultados
def fetch_traffic(since):
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT id, client_ip, inbound, outbound, protocols, created_at
                FROM traffic_logs
                WHERE created_at >= %s
            """, (since,))
            return cursor.fetchall()
