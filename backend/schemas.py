from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

# Usuario
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
        orm_mode = True

# Tarea
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
        orm_mode = True

# Completaciones (task_completions)
class TaskCompletionResponse(BaseModel):
    id: int
    task_id: int
    user: UserResponse        # Cambiado de 'student' a 'user' para coincidir con el modelo SQLAlchemy
    completed_at: Optional[datetime]
    notes: Optional[str]
    
    class Config:
        orm_mode = True

class TaskWithCompletions(BaseModel):
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
    completions: List[TaskCompletionResponse]
    
    class Config:
        orm_mode = True

# Autenticación
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Estadísticas
class OverviewStats(BaseModel):
    total_tasks: int
    total_students: int
    total_completions: int
    completed_completions: int
    pending_completions: int
    overall_completion_rate: float

class TaskStats(BaseModel):
    task_id: int
    task_title: str
    total_completions: int
    completed: int
    pending: int
    completion_rate: float
    created_at: datetime

class StudentStats(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    completion_rate: float

# Esquema para tareas del estudiante
class MyTaskResponse(BaseModel):
    completion_id: int
    task: TaskResponse
    completed_at: Optional[datetime]
    notes: Optional[str]

    class Config:
        orm_mode = True
