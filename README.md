# MomentumAI

> Your Personal Execution System

MomentumAI is an AI-powered productivity platform that helps users turn long-term goals into actionable tasks, personalized plans, and consistent progress.

## 🚀 Overview

**MomentumAI** is a full-stack AI productivity platform designed to go beyond traditional to-do lists.

Instead of simply storing tasks, the system analyzes the user's goals and workload and uses AI to help answer:

* What should I work on next?
* How long will this task realistically take?
* How should a large task be broken down?
* Which tasks should I prioritize?
* What should today's plan look like?
* Why is a particular task being recommended?
* How is my overall workload and deadline pressure?

The system combines **goal management, task management, intelligent prioritization, AI task breakdown, time estimation, daily planning, analytics, and a Digital Twin-style productivity state** into a single system.

---

# ✨ Features

## 🎯 Goal Management

Users can create and manage long-term goals with information such as:

* Goal title
* Deadline
* Priority
* Available working hours
* Notes

Supported operations:

* Create goals
* View goals
* Edit goals
* Delete goals
* Track associated tasks
* Generate AI-driven tasks from goals

Goals and tasks maintain an explicit relationship through `goal_id`.

---

## ✅ Task Management

The task management system supports:

* Create tasks
* View tasks
* Edit tasks
* Delete tasks
* Mark tasks as completed
* Associate tasks with goals
* Filter tasks by goal
* Filter by status
* Filter by priority
* Search tasks

Tasks maintain their relationship with the corresponding goal through `goal_id`.

### Goal-Based Filtering

The Tasks page supports dynamic goal filtering:

```text
All Goals
    ↓
All tasks

Goal A
    ↓
Only Goal A tasks

Goal B
    ↓
Only Goal B tasks
```

The filtering is based on the actual `goal_id` relationship rather than title/string matching.

---

# 🤖 AI Capabilities

## 1. AI Task Breakdown

Large tasks can be decomposed into smaller actionable subtasks.

The system generates:

* Individual steps
* Estimated duration
* Difficulty
* Logical ordering

Example:

```text
Learn Programming Fundamentals
        ↓
Step 1 → Read introduction
Step 2 → Watch fundamentals video
Step 3 → Write basic pseudocode
...
```

---

## 2. Smart Task Prioritization

The prioritization engine evaluates pending tasks and assigns priority tiers based on factors such as:

* Goal importance
* Urgency
* Deadline
* Task difficulty
* Workload
* Overall productivity context

The system can identify critical/urgent tasks and provide a recommended focus order.

---

## 3. AI Time Estimation

Tasks receive AI-generated estimates for realistic completion time.

The estimation system provides:

* Estimated minutes
* Difficulty
* Confidence

Example:

```text
Task:
Understand variables, data types and operators

Estimated Time:
45 minutes

Difficulty:
Medium

Confidence:
High
```

---

## 4. AI Daily Planner

The Daily Planner generates a practical plan based on the user's available time and pending workload.

It considers:

* Available working capacity
* Pending tasks
* Priority
* Estimated duration
* Deadlines

The planner creates a constrained daily plan rather than simply returning every pending task.

---

## 5. Next Best Task

The system identifies the task that should be worked on next.

The recommendation includes:

* Task
* Goal
* Duration
* Difficulty
* Priority
* Reason for recommendation
* Suggested kickoff action

Example:

```text
Next Best Task
────────────────────────
Integrate AI Daily Planner

Duration: 45 min
Difficulty: Medium
Priority: High

Why?
This task advances a high-priority goal,
has deadline pressure, and can be meaningfully
progressed within the available time.

Kickoff:
Open the FastAPI codebase and begin the planner integration.
```

---

## 6. Unified AI Recommendation Pipeline

The application combines multiple AI capabilities into a unified recommendation flow.

The pipeline can:

1. Identify a suitable task
2. Estimate its duration
3. Determine its priority
4. Break it into subtasks
5. Provide reasoning
6. Recommend the immediate next action

This creates a single AI-driven workflow rather than isolated AI utilities.

---

# 🧠 Digital Twin

The application maintains a productivity state representing the user's current workload and progress.

The Digital Twin analyzes information such as:

* Active goals
* Pending tasks
* Completion rate
* Workload pressure
* Deadline pressure

Example state:

```text
Active Goals: 13
Tasks: 92
Pending Tasks: 86
Completion Rate: 6.5%
Workload Pressure: High
Deadline Pressure: High
```

This state can be used by downstream AI systems to make more context-aware recommendations.

---

# 🏗️ Architecture

The project follows a full-stack architecture:

```text
                ┌──────────────────────┐
                │      Frontend        │
                │      Next.js         │
                │                      │
                │ Dashboard            │
                │ Goals                │
                │ Tasks                │
                │ AI Planner           │
                │ Analytics            │
                │ Settings             │
                └──────────┬───────────┘
                           │
                           │ REST API
                           ▼
                ┌──────────────────────┐
                │       FastAPI        │
                │       Backend        │
                │                      │
                │ Goals API            │
                │ Tasks API            │
                │ Digital Twin         │
                │ AI Services          │
                │ Recommendation       │
                └──────────┬───────────┘
                           │
              ┌────────────┼─────────────┐
              ▼            ▼             ▼
        ┌──────────┐ ┌───────────┐ ┌──────────┐
        │ Database │ │ AI / LLM  │ │ Schemas  │
        │          │ │ Services  │ │ & CRUD   │
        └──────────┘ └───────────┘ └──────────┘
```

---

# 🛠️ Tech Stack

## Frontend

* **Next.js**
* **React**
* JavaScript
* CSS
* CSS-based theme system

## Backend

* **Python**
* **FastAPI**
* **Pydantic**
* SQLAlchemy
* REST APIs

## Database

* **SQLite**
* SQLAlchemy ORM

## AI

* **Groq LLM**
* Custom AI prompt modules
* AI helper utilities
* Task decomposition
* Prioritization
* Time estimation
* Daily planning
* Next-task recommendation

---

# 🎨 Theme System

The application includes a multi-theme UI system designed around reusable CSS variables.

Current themes:

* 🌊 **Ocean**
* 🌲 **Forest**
* 🌌 **Galaxy**
* 🌸 **Pastel**
* 🌅 **Sunset**

The theme system uses semantic variables rather than hardcoding colors throughout individual components.

Conceptually:

```css
--bg
--surface
--text
--text-secondary
--primary
--secondary
--accent
--border
```

This allows the same UI components to adapt to different visual themes without changing their structure.

### Sunset Palette

The finalized Sunset palette uses:

```text
#D65DB1
#FF6F91
#FF9671
#FFC75F
#F9F871
```

The Pastel theme also maintains dark/black primary text for readability and contrast.

---

# 🖋️ Typography

The application's finalized typography uses **Marck Script** as the display/branding font while keeping the main UI typography readable and functional.

Marck Script is intentionally reserved for display/branding rather than dense UI content such as:

* Tasks
* Buttons
* Inputs
* Dropdowns
* Analytics
* Metadata

---

# 🔌 API Capabilities

The backend currently supports functionality including:

```text
GET    /goals
POST   /goals
PUT    /goals/{id}
DELETE /goals/{id}

GET    /tasks
POST   /tasks
PUT    /tasks/{id}
DELETE /tasks/{id}

GET    /goals/{id}/tasks

GET    /digital-twin
```

Additional AI endpoints support:

* Roadmap generation
* Task breakdown
* Task prioritization
* Time estimation
* Daily planning
* Next-best-task recommendation
* Unified AI recommendations

---

# 🧪 Testing & Verification

Phase 2 backend capabilities were verified through a dedicated verification suite.

### Phase 2 Verification

```text
1. Digital Twin State                 PASSED
2. AI Task Breakdown                  PASSED
3. Smart Task Prioritization          PASSED
4. AI Time Estimation                 PASSED
5. AI Daily Planner                   PASSED
6. AI Next Best Task                  PASSED
7. Unified AI Recommendation          PASSED
8. Goal & Task CRUD                   PASSED
```

### Integration Verification

The frontend/backend integration was additionally verified for:

* Goals API
* Tasks API
* `goal_id` serialization
* Goal-scoped tasks
* Digital Twin
* Task CRUD
* Goal CRUD
* Frontend build
* Tasks route
* Goal → Task filtering

### Goal Filtering Verification

The final runtime verification confirmed:

```text
All Goals       → 21 tasks
ML              → 0 tasks
Learn Java      → 21 tasks
```

Every task displayed under **Learn Java** was verified to have:

```text
goal_id = 2
```

The empty state for goals with no tasks was also verified.

---

# 📁 Project Structure

A simplified structure:

```text
MomentumAI/
│
├── backend/
│   ├── app.py
│   ├── crud.py
│   ├── schemas.py
│   ├── models/
│   ├── AI services/
│   │   ├── ai_helpers.py
│   │   ├── digital_twin.py
│   │   ├── task_breakdown.py
│   │   ├── task_prioritizer.py
│   │   ├── time_estimator.py
│   │   ├── daily_planner.py
│   │   ├── next_task.py
│   │   └── recommender.py
│   │
│   └── prompts/
│       ├── task_breakdown_prompt.py
│       ├── prioritizer_prompt.py
│       ├── time_estimator_prompt.py
│       ├── daily_planner_prompt.py
│       └── next_task_prompt.py
│
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── goals/
│   │   ├── tasks/
│   │   ├── ai-planner/
│   │   ├── analytics/
│   │   └── settings/
│   │
│   ├── components/
│   ├── styles/
│   └── api.js
│
└── README.md
```

---

# 🔄 Core Workflow

The intended workflow is:

```text
Create Goal
     ↓
Define Goal Details
     ↓
Generate / Create Tasks
     ↓
AI Task Breakdown
     ↓
AI Time Estimation
     ↓
Smart Prioritization
     ↓
Daily Planner
     ↓
Next Best Task
     ↓
Complete Tasks
     ↓
Digital Twin Updates
     ↓
AI Recommendations Improve
```

This makes the application more than a static task manager: **the user's task history and current workload become inputs into the planning system.**

---

# 📊 Current Application Pages

### Dashboard

Central productivity overview and Digital Twin insights.

### Goals

Create, manage, and monitor long-term goals.

### Tasks

Manage tasks, filter them by goal/status/priority, search, and track completion.

### AI Planner

Access AI-powered planning, prioritization, task estimation, decomposition, and next-task recommendations.

### Analytics

View productivity and task/goal progress information.

### Settings

Manage application appearance and themes.

---

# 🚧 Current Status

### Completed

* Full-stack application foundation
* Goal CRUD
* Task CRUD
* Goal-task relationships
* Digital Twin
* AI task breakdown
* AI prioritization
* AI time estimation
* AI Daily Planner
* Next Best Task
* Unified AI recommendation pipeline
* Frontend/backend integration
* Theme system
* Main application pages
* Task filtering
* API verification
* Integration verification

### Remaining

**Phase G — Final UI/UX polish**

This is intentionally a final refinement phase rather than a functional development phase. The core functionality and frontend/backend integration are already implemented and verified.

---

# 🎯 Project Goal

The long-term goal of MomentumAI is to create a **personalized productivity operating system** rather than another conventional task manager.

The system should progressively understand:

```text
Goals
  +
Tasks
  +
Deadlines
  +
Available Time
  +
Difficulty
  +
Completion History
  +
Current Workload
        ↓
Personalized Planning
        ↓
Better Next Actions
```

The focus is on **context-aware productivity**, where AI helps users decide *what to do, when to do it, how long it will take, and how to break it down* rather than simply storing a list of tasks.
