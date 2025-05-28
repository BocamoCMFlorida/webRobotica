from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import mysql.connector
from mysql.connector import Error
from config import SQLALCHEMY_DATABASE_URL, MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE

# Crear la base de datos si no existe
def create_database_if_not_exists():
    try:
        connection = mysql.connector.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD
        )
        cursor = connection.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        cursor.close()
        connection.close()
        print(f"Base de datos '{MYSQL_DATABASE}' creada o ya existe")
    except Error as e:
        print(f"Error al crear la base de datos: {e}")

# Crear la base de datos antes de inicializar SQLAlchemy
create_database_if_not_exists()

# Configuración de SQLAlchemy
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False  # Cambiar a True para debug
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Función para obtener la sesión de base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Función para crear las tablas en la base de datos
def create_tables():
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas en la base de datos (si no existían).")
