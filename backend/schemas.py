from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

# Esquemas de Usuario
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

# Esquemas de Tarea
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

# Esquemas de Envío de Tarea
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

# Esquemas de Autenticación
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Esquemas de Estadísticas
class OverviewStats(BaseModel):
    total_tasks: int
    total_students: int
    total_submissions: int
    completed_submissions: int
    pending_submissions: int
    overall_completion_rate: float

class TaskStats(BaseModel):
    task_id: int
    task_title: str
    total_assignments: int
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
    submission_id: int
    task: TaskResponse
    completed: bool
    completed_at: Optional[datetime]
    notes: Optional[str]