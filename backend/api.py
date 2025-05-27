  # Agrega esta línea al inicio de tu archivo api.pyfrom fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
import os
import shutil
import uuid
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext  # ✅ Importación necesaria
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
import os
import shutil
import uuid
from pathlib import Path

# Configuración de la base de datos
SQLALCHEMY_DATABASE_URL = "sqlite:///./tasks_app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Configuración de seguridad
SECRET_KEY = "tu_clave_secreta_super_segura_aqui"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ✅ ESTAS LÍNEAS SON CRÍTICAS
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


# Configuración de archivos
UPLOAD_DIR = "uploads"
Path(UPLOAD_DIR).mkdir(exist_ok=True)

# Modelos de base de datos
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    created_tasks = relationship("Task", back_populates="creator")
    task_submissions = relationship("TaskSubmission", back_populates="student")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    image_path = Column(String)  # Ruta de la imagen del robot
    created_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"))
    
    # Relaciones
    creator = relationship("User", back_populates="created_tasks")
    submissions = relationship("TaskSubmission", back_populates="task")

class TaskSubmission(Base):
    __tablename__ = "task_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relaciones
    task = relationship("Task", back_populates="submissions")
    student = relationship("User", back_populates="task_submissions")

# Crear tablas
Base.metadata.create_all(bind=engine)

# Modelos Pydantic
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    is_admin: bool = False

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    title: str
    description: str
    due_date: Optional[datetime] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    image_path: Optional[str]
    created_at: datetime
    due_date: Optional[datetime]
    creator: UserResponse
    
    class Config:
        from_attributes = True

class TaskSubmissionResponse(BaseModel):
    id: int
    task_id: int
    student: UserResponse
    completed: bool
    completed_at: Optional[datetime]
    notes: Optional[str]
    
    class Config:
        from_attributes = True

class TaskWithSubmissions(BaseModel):
    id: int
    title: str
    description: str
    image_path: Optional[str]
    created_at: datetime
    due_date: Optional[datetime]
    total_students: int
    completed_count: int
    pending_count: int
    completion_rate: float
    submissions: List[TaskSubmissionResponse]
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Funciones de utilidad
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

def get_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# Inicializar FastAPI
app = FastAPI(title="Sistema de Tareas Educativas", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoints de autenticación
@app.post("/register", response_model=UserResponse)
def register_user(
    email: EmailStr = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    is_admin: bool = Form(False),
    db: Session = Depends(get_db)
):
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = get_password_hash(password)
    db_user = models.User(
        email=email,
        username=username,
        hashed_password=hashed_password,
        is_admin=is_admin,
        created_at=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=Token)
def login_user(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Endpoints de tareas (solo administradores)
@app.post("/tasks", response_model=TaskResponse)
def create_task(
    title: str = Form(...),
    description: str = Form(...),
    due_date: Optional[str] = Form(None),
    image: UploadFile = File(...),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    # Validar tipo de archivo
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    if image.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are allowed")
    
    # Guardar imagen con nombre único
    file_extension = image.filename.split(".")[-1] if image.filename else "jpg"
    file_name = f"task_{uuid.uuid4().hex}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error saving image")
    
    # Convertir fecha si se proporciona
    due_date_obj = None
    if due_date:
        try:
            due_date_obj = datetime.fromisoformat(due_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
    
    # Crear tarea
    db_task = Task(
        title=title,
        description=description,
        image_path=f"/uploads/{file_name}",  # URL relativa para el frontend
        due_date=due_date_obj,
        creator_id=current_user.id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Crear submissions para todos los estudiantes
    students = db.query(User).filter(User.is_admin == False).all()
    for student in students:
        submission = TaskSubmission(
            task_id=db_task.id,
            student_id=student.id
        )
        db.add(submission)
    
    db.commit()
    return db_task

@app.get("/tasks", response_model=List[TaskResponse])
def get_all_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks = db.query(Task).all()
    return tasks

@app.get("/tasks/{task_id}", response_model=TaskWithSubmissions)
def get_task_details(
    task_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    submissions = db.query(TaskSubmission).filter(TaskSubmission.task_id == task_id).all()
    total_students = len(submissions)
    completed_count = len([s for s in submissions if s.completed])
    pending_count = total_students - completed_count
    completion_rate = (completed_count / total_students * 100) if total_students > 0 else 0
    
    return TaskWithSubmissions(
        id=task.id,
        title=task.title,
        description=task.description,
        image_path=task.image_path,
        created_at=task.created_at,
        due_date=task.due_date,
        total_students=total_students,
        completed_count=completed_count,
        pending_count=pending_count,
        completion_rate=round(completion_rate, 2),
        submissions=submissions
    )

# Endpoints para estudiantes
@app.get("/my-tasks")
def get_my_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admins cannot have assigned tasks")
    
    submissions = db.query(TaskSubmission).filter(
        TaskSubmission.student_id == current_user.id
    ).all()
    
    result = []
    for submission in submissions:
        task_data = {
            "submission_id": submission.id,
            "task": submission.task,
            "completed": submission.completed,
            "completed_at": submission.completed_at,
            "notes": submission.notes
        }
        result.append(task_data)
    
    return result

@app.put("/tasks/{task_id}/complete")
def mark_task_complete(
    task_id: int,
    notes: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admins cannot complete tasks")
    
    submission = db.query(TaskSubmission).filter(
        TaskSubmission.task_id == task_id,
        TaskSubmission.student_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Task assignment not found")
    
    submission.completed = True
    submission.completed_at = datetime.utcnow()
    if notes:
        submission.notes = notes
    
    db.commit()
    return {"message": "Task marked as completed"}

@app.put("/tasks/{task_id}/uncomplete")
def mark_task_incomplete(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admins cannot uncomplete tasks")
    
    submission = db.query(TaskSubmission).filter(
        TaskSubmission.task_id == task_id,
        TaskSubmission.student_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Task assignment not found")
    
    submission.completed = False
    submission.completed_at = None
    submission.notes = None
    
    db.commit()
    return {"message": "Task marked as incomplete"}

# Endpoints de estadísticas (solo administradores)
@app.get("/statistics/overview")
def get_statistics_overview(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    total_tasks = db.query(Task).count()
    total_students = db.query(User).filter(User.is_admin == False).count()
    total_submissions = db.query(TaskSubmission).count()
    completed_submissions = db.query(TaskSubmission).filter(TaskSubmission.completed == True).count()
    
    overall_completion_rate = (completed_submissions / total_submissions * 100) if total_submissions > 0 else 0
    
    return {
        "total_tasks": total_tasks,
        "total_students": total_students,
        "total_submissions": total_submissions,
        "completed_submissions": completed_submissions,
        "pending_submissions": total_submissions - completed_submissions,
        "overall_completion_rate": round(overall_completion_rate, 2)
    }

@app.get("/statistics/tasks")
def get_task_statistics(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    tasks = db.query(Task).all()
    task_stats = []
    
    for task in tasks:
        submissions = db.query(TaskSubmission).filter(TaskSubmission.task_id == task.id).all()
        total = len(submissions)
        completed = len([s for s in submissions if s.completed])
        completion_rate = (completed / total * 100) if total > 0 else 0
        
        task_stats.append({
            "task_id": task.id,
            "task_title": task.title,
            "total_assignments": total,
            "completed": completed,
            "pending": total - completed,
            "completion_rate": round(completion_rate, 2),
            "created_at": task.created_at
        })
    
    return task_stats

@app.get("/statistics/students")
def get_student_statistics(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    students = db.query(User).filter(User.is_admin == False).all()
    student_stats = []
    
    for student in students:
        submissions = db.query(TaskSubmission).filter(TaskSubmission.student_id == student.id).all()
        total = len(submissions)
        completed = len([s for s in submissions if s.completed])
        completion_rate = (completed / total * 100) if total > 0 else 0
        
        student_stats.append({
            "student_id": student.id,
            "student_name": student.username,
            "student_email": student.email,
            "total_tasks": total,
            "completed_tasks": completed,
            "pending_tasks": total - completed,
            "completion_rate": round(completion_rate, 2)
        })
    
    return student_stats

# Endpoint para servir imágenes
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def root():
    return {
        "message": "API del Sistema de Tareas Educativas",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "register": "/register",
            "login": "/login"
        }
    }

# Crear usuario administrador por defecto
@app.on_event("startup")
def create_default_admin():
    db = SessionLocal()
    try:
        # Verificar si ya existe un admin
        admin_exists = db.query(User).filter(User.is_admin == True).first()
        if not admin_exists:
            # Crear admin por defecto
            admin_user = User(
                email="admin@example.com",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                is_admin=True
            )
            db.add(admin_user)
            db.commit()
            print("Usuario administrador creado: admin/admin123")
    except Exception as e:
        print(f"Error creating default admin: {e}")
    finally:
        db.close()

if __name__ == "__api__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
