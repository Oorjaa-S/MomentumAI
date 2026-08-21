const API = process.env.NEXT_PUBLIC_API || "http://127.0.0.1:8000";

export async function getGoals() {
  const res = await fetch(`${API}/goals`);
  if (!res.ok) {
    throw new Error("Failed to fetch goals");
  }
  return res.json();
}

export async function createGoal(goal) {
  const res = await fetch(`${API}/goals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(goal),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }

  return res.json();
}

export async function updateGoal(id, goal) {
  const res = await fetch(`${API}/goals/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(goal),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}

export async function deleteGoal(id) {
  const res = await fetch(`${API}/goals/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete goal");
  }

  return res.json();
}

export async function getAllTasks() {
  const res = await fetch(`${API}/tasks`);
  if (!res.ok) {
    throw new Error("Failed to fetch all tasks");
  }
  return res.json();
}

export async function getTasks(goalId) {
  const res = await fetch(`${API}/goals/${goalId}/tasks`);
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks for goal #${goalId}`);
  }
  return res.json();
}

export async function createTask(goalId, title) {
  const res = await fetch(`${API}/goals/${goalId}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    throw new Error("Failed to create task");
  }

  return res.json();
}

export async function updateTask(taskId, task) {
  const res = await fetch(`${API}/tasks/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!res.ok) {
    throw new Error("Failed to update task");
  }

  return res.json();
}

export async function deleteTask(taskId) {
  const res = await fetch(`${API}/tasks/${taskId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete task");
  }

  return res.json();
}

export async function generateTasks(goalId) {
  const res = await fetch(`${API}/goals/${goalId}/generate-tasks`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Failed to generate AI tasks for goal");
  }

  return res.json();
}

export async function generateRoadmap(data) {
  const res = await fetch(`${API}/generate-roadmap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to generate roadmap");
  }

  return res.json();
}

export async function createAIGoal(data) {
  const res = await fetch(`${API}/goals/ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create AI goal");
  }

  return res.json();
}

export async function getDigitalTwin() {
  const res = await fetch(`${API}/digital-twin`);
  if (!res.ok) {
    throw new Error("Failed to fetch digital twin state");
  }
  return res.json();
}

export async function generateDailyPlan(params = {}) {
  const res = await fetch(`${API}/ai/daily-plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error("Failed to generate daily plan");
  }
  return res.json();
}

export async function prioritizeTasks(params = {}) {
  const res = await fetch(`${API}/ai/prioritize-tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error("Failed to prioritize tasks");
  }
  return res.json();
}

export async function estimateTaskTime(params = {}) {
  const res = await fetch(`${API}/ai/estimate-time`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error("Failed to estimate task time");
  }
  return res.json();
}

export async function breakdownTask(taskId) {
  const res = await fetch(`${API}/ai/breakdown-task/${taskId}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to breakdown task #${taskId}`);
  }
  return res.json();
}

export async function getNextTask(params = {}) {
  const res = await fetch(`${API}/ai/next-task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error("Failed to get next best task recommendation");
  }
  return res.json();
}

export async function getUnifiedRecommendation(params = {}) {
  const res = await fetch(`${API}/ai/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error("Failed to get unified AI recommendation");
  }
  return res.json();
}