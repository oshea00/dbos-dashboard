import os

from dbos import DBOS, DBOSConfig

APP_NAME = "dbos-app-starter"
APPLICATION_VERSION = "0.1.0"


def get_dbos_config() -> DBOSConfig:
    return {
        "name": APP_NAME,
        "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
        "application_version": APPLICATION_VERSION,
    }


def configure_dbos() -> None:
    DBOS(config=get_dbos_config())
