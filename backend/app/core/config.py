import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    ENVIRONMENT: str = os.getenv(
        "ENVIRONMENT",
        "development"
    )

    DEBUG: bool = (
        ENVIRONMENT == "development"
    )

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./app.db"
    )

    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        ""
    )

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv(
            "ACCESS_TOKEN_EXPIRE_MINUTES",
            "1440"
        )
    )

    WHISPER_MODEL_SIZE: str = os.getenv(
        "WHISPER_MODEL_SIZE",
        "tiny"
    )

    COMPUTE_TYPE: str = os.getenv(
        "COMPUTE_TYPE",
        "int8"
    )

    DEVICE: str = os.getenv(
        "DEVICE",
        "cpu"
    )

    FRONTEND_URL: str = os.getenv(
        "FRONTEND_URL",
        ""
    )


settings = Settings()

os.makedirs(
    "./exports",
    exist_ok=True
)

os.makedirs(
    "./data",
    exist_ok=True
)