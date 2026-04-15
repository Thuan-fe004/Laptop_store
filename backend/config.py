import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config:
    # ── MySQL ────────────────────────────────────────────
    # Ưu tiên dùng DATABASE_URL từ Railway
    DATABASE_URL = os.getenv('DATABASE_URL') or os.getenv('MYSQL_URL')

    if DATABASE_URL and DATABASE_URL.startswith('mysql://'):
        # Thêm driver pymysql (bắt buộc trên Railway)
        SQLALCHEMY_DATABASE_URI = DATABASE_URL.replace(
            'mysql://', 'mysql+pymysql://', 1
        )
    else:
        # Fallback cho local development
        DB_USER     = os.getenv('DB_USER', 'root')
        DB_PASSWORD = os.getenv('DB_PASSWORD', '123456')
        DB_HOST     = os.getenv('DB_HOST', 'localhost')
        DB_PORT     = os.getenv('DB_PORT', '3306')
        DB_NAME     = os.getenv('DB_NAME', 'laptop_store')

        SQLALCHEMY_DATABASE_URI = (
            f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
            f"@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
        )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 3600,
    }

    # ── JWT & Security ───────────────────────────────────
    SECRET_KEY               = os.getenv('SECRET_KEY', 'laptop_store_secret_key_2024_abcd')
    JWT_SECRET_KEY           = os.getenv('JWT_SECRET_KEY', 'laptop_store_jwt_key_2024_abcd')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))
    )

    # ── Upload ───────────────────────────────────────────
    UPLOAD_FOLDER      = os.path.join(BASE_DIR, 'static', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024   # 16 MB

    # ── CORS ─────────────────────────────────────────────
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173')