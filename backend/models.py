from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relaciones
    created_tasks = relationship("Task", back_populates="creator")
    task_submissions = relationship("TaskSubmission", back_populates="student")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=False)
    image_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    due_date = Column(DateTime, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relaciones
    creator = relationship("User", back_populates="created_tasks")
    submissions = relationship("TaskSubmission", back_populates="task", cascade="all, delete-orphan")

class TaskSubmission(Base):
    __tablename__ = "task_submissions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relaciones
    task = relationship("Task", back_populates="submissions")
    student = relationship("User", back_populates="task_submissions")