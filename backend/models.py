from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True)
    email = Column(String, unique=True)
    password = Column(String)

    goals = relationship("Goal", back_populates="owner")


class Goal(Base):
    __tablename__ = "goals"
    __table_args__ = (
        UniqueConstraint("title", "owner_id", name="uq_goal_title_owner"),
    )

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False, index=True)
    deadline = Column(String, default="")
    priority = Column(String, default="Medium")
    available_hours = Column(Integer, default=1)
    notes = Column(String, default="")

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    owner = relationship("User", back_populates="goals")
    tasks = relationship(
        "Task",
        back_populates="goal",
        cascade="all, delete-orphan",
    )


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        UniqueConstraint("title", "goal_id", name="uq_task_title_goal"),
    )

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False, index=True)
    completed = Column(Boolean, default=False)

    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)

    goal = relationship("Goal", back_populates="tasks")