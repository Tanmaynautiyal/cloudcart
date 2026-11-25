import os
import json
from typing import List, Union
from dotenv import load_dotenv

# Load .env file from the current directory or parent directory
load_dotenv()

try:
    from pydantic_settings import BaseSettings
    from pydantic import field_validator

    class Settings(BaseSettings):
        PROJECT_NAME: str = "CloudCart API"
        API_V1_STR: str = "/api/v1"
        SECRET_KEY: str = "cloudcart-super-secret-jwt-key-change-in-production-use-openssl-rand-hex-32"
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour
        REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days

        # Database URL (PostgreSQL default, configured for system PostgreSQL on port 5432)
        DATABASE_URL: str = "postgresql+psycopg://postgres:123456@127.0.0.1:5432/cloudcart_db"

        # Local Uploads Directory (Dedicated local disk storage, no AWS S3)
        UPLOAD_DIR: str = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads"
        )

        # CORS Origins
        BACKEND_CORS_ORIGINS: List[str] = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:3000",
        ]

        @field_validator("BACKEND_CORS_ORIGINS", mode="before")
        @classmethod
        def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
            if isinstance(v, str) and not v.startswith("["):
                return [i.strip() for i in v.split(",") if i.strip()]
            elif isinstance(v, str) and v.startswith("["):
                try:
                    return json.loads(v)
                except Exception:
                    return ["http://localhost:5173", "http://127.0.0.1:5173"]
            return v

        model_config = {
            "case_sensitive": True,
            "env_file": ".env",
            "extra": "ignore",
        }

except ImportError:
    # Fallback if pydantic-settings is not yet installed in venv
    from pydantic import BaseModel

    class Settings(BaseModel):
        PROJECT_NAME: str = os.getenv("PROJECT_NAME", "CloudCart API")
        API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
        SECRET_KEY: str = os.getenv(
            "SECRET_KEY",
            "cloudcart-super-secret-jwt-key-change-in-production-use-openssl-rand-hex-32"
        )
        ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
        ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
        REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        DATABASE_URL: str = os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg://postgres:123456@127.0.0.1:5432/cloudcart_db"
        )
        UPLOAD_DIR: str = os.getenv(
            "UPLOAD_DIR",
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
        )
        BACKEND_CORS_ORIGINS: List[str] = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
        ]


settings = Settings()
