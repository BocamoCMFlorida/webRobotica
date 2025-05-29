from fastapi import FastAPI, HTTPException, status, File, UploadFile, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime
from typing import List, Optional
import os
import shutil
import uuid
from pathlib import Path
from fastapi import Response

# Importaciones locales
from database import get_db, SessionLocal
from models import User, Task, TaskCompletion
from schemas import (
    UserCreate, UserResponse, TaskCreate, TaskResponse, 
    TaskCompletionResponse, TaskWithCompletions
)

# Contexto de contraseñas (aún necesario para registro)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuración de archivos
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
Path(UPLOAD_DIR).mkdir(exist_ok=True)

# Funciones de utilidad
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Inicializar FastAPI
app = FastAPI(
    title="Sistema de Tareas Educativas", 
    version="1.0.0",
    description="API para gestión de tareas educativas con MySQL (Sin Autenticación)"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoints de usuarios
@app.post("/register", response_model=UserResponse)
def register_user(
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    is_admin: bool = Form(False),
    db: Session = Depends(get_db)
):
    # Verificar si el email ya existe
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Verificar si el username ya existe
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = get_password_hash(password)
    db_user = User(
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

@app.post("/logout")
def logout(response: Response):
    # Borrar cookie de sesión (si existiera)
    response.delete_cookie(key="session")
    return {"message": "Sesión cerrada, por favor inicia sesión nuevamente"}

@app.post("/login")
def login_user(
    username: str = Form(...), 
    password: str = Form(...), 
    db: Session = Depends(get_db)
):
    """
    Endpoint de login simplificado - solo verifica credenciales
    """
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
  
    return {
        "message": "Login successful",
        "user_id": user.id,
        "username": user.username,
        "is_admin": user.is_admin
    }

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

# Endpoints de tareas
@app.post("/tasks", response_model=TaskResponse)
def create_task(
    title: str = Form(...),
    description: str = Form(...),
    due_date: Optional[str] = Form(None),
    image: UploadFile = File(...),
    creator_id: int = Form(...),  # Ahora se pasa el ID del creador directamente
    db: Session = Depends(get_db)
):
    # Verificar que el creador existe y es admin
    creator = db.query(User).filter(User.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator user not found")
  
    if not creator.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can create tasks")

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
        image_path=f"/uploads/{file_name}",
        due_date=due_date_obj,
        creator_id=creator_id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    # Crear TaskCompletion para todos los estudiantes
    students = db.query(User).filter(User.is_admin == False).all()
    for student in students:
        task_completion = TaskCompletion(
            task_id=db_task.id,
            student_id=student.id,
            completed=False,
            created_at=datetime.utcnow()
        )
        db.add(task_completion)
  
    db.commit()
    return db_task

@app.get("/tasks", response_model=List[TaskResponse])
def get_all_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    return tasks

@app.get("/tasks/{task_id}", response_model=TaskWithCompletions)
def get_task_details(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    completions = db.query(TaskCompletion).filter(TaskCompletion.task_id == task_id).all()
    total_completions = len(completions)
    completed_count = len([c for c in completions if c.completed])
    pending_count = total_completions - completed_count
    completion_rate = (completed_count / total_completions * 100) if total_completions > 0 else 0

    return TaskWithCompletions(
        id=task.id,
        title=task.title,
        description=task.description,
        image_path=task.image_path,
        created_at=task.created_at,
        due_date=task.due_date,
        total_students=total_completions,
        completed_count=completed_count,
        pending_count=pending_count,
        completion_rate=round(completion_rate, 2),
        completions=completions
    )

@app.get("/users/{user_id}/tasks", response_model=List[TaskCompletionResponse])
def get_user_tasks(user_id: int, db: Session = Depends(get_db)):
    """
    Obtener las tareas asignadas a un usuario específico
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
  
    if user.is_admin:
        raise HTTPException(status_code=403, detail="Admins cannot have assigned tasks")

    completions = db.query(TaskCompletion).filter(
        TaskCompletion.student_id == user_id
    ).all()

    return completions

@app.put("/tasks/{task_id}/complete")
def mark_task_complete(
    task_id: int,
    user_id: int = Form(...),  # Ahora se pasa el ID del usuario directamente
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Verificar que el usuario existe y no es admin
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
  
    if user.is_admin:
        raise HTTPException(status_code=403, detail="Admins cannot complete tasks")

    completion = db.query(TaskCompletion).filter(
        TaskCompletion.task_id == task_id,
        TaskCompletion.student_id == user_id
    ).first()

    if not completion:
        raise HTTPException(status_code=404, detail="Task completion record not found")

    completion.completed = True
    completion.completed_at = datetime.utcnow()
    if notes:
        completion.notes = notes

    db.commit()
    return {"message": "Task marked as completed"}

@app.put("/tasks/{task_id}/uncomplete")
def mark_task_incomplete(
    task_id: int,
    user_id: int = Form(...),  # Ahora se pasa el ID del usuario directamente
    db: Session = Depends(get_db)
):
    # Verificar que el usuario existe y no es admin
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
  
    if user.is_admin:
        raise HTTPException(status_code=403, detail="Admins cannot uncomplete tasks")

    completion = db.query(TaskCompletion).filter(
        TaskCompletion.task_id == task_id,
        TaskCompletion.student_id == user_id
    ).first()

    if not completion:
        raise HTTPException(status_code=404, detail="Task completion record not found")

    completion.completed = False
    completion.completed_at = None
    completion.notes = None

    db.commit()
    return {"message": "Task marked as not completed"}

# Endpoints de estadísticas
@app.get("/statistics/overview")
def get_statistics_overview(db: Session = Depends(get_db)):
    total_tasks = db.query(Task).count()
    total_students = db.query(User).filter(User.is_admin == False).count()
    total_completions = db.query(TaskCompletion).count()
    completed_completions = db.query(TaskCompletion).filter(TaskCompletion.completed == True).count()

    overall_completion_rate = (completed_completions / total_completions * 100) if total_completions > 0 else 0

    return {
        "total_tasks": total_tasks,
        "total_students": total_students,
        "total_assignments": total_completions,
        "completed_assignments": completed_completions,
        "pending_assignments": total_completions - completed_completions,
        "overall_completion_rate": round(overall_completion_rate, 2)
    }

@app.get("/statistics/tasks")
def get_task_statistics(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    task_stats = []

    for task in tasks:
        completions = db.query(TaskCompletion).filter(TaskCompletion.task_id == task.id).all()
        total = len(completions)
        completed = len([c for c in completions if c.completed])
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
def get_student_statistics(db: Session = Depends(get_db)):
    students = db.query(User).filter(User.is_admin == False).all()
    student_stats = []

    for student in students:
        completions = db.query(TaskCompletion).filter(TaskCompletion.student_id == student.id).all()
        total = len(completions)
        completed = len([c for c in completions if c.completed])
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

# Montar carpeta estática para imágenes
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def root():
    return {
        "message": "API del Sistema de Tareas Educativas (Sin Autenticación)",
        "version": "1.0.0",
        "database": "MySQL",
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "register": "/register",
            "login": "/login",
            "users": "/users",
            "tasks": "/tasks",
            "statistics": "/statistics/overview"
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)