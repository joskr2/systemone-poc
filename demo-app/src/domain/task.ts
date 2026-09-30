export interface Task {
  id: string;
  title: string;
  done: boolean;
}

export type TaskFilter = 'all' | 'active' | 'done';

/**
 * Adds a task with a trimmed title. Empty or whitespace-only titles are
 * ignored and the input array is always left untouched.
 */
export function addTask(tasks: Task[], title: string): Task[] {
  const trimmed = title.trim();

  if (trimmed === '') {
    return tasks.slice();
  }

  const task: Task = {
    id: crypto.randomUUID(),
    title: trimmed,
    done: false,
  };

  return [...tasks, task];
}

/**
 * Returns a new array where the task matching `id` has its `done` flag
 * flipped. When no task matches, the array is copied unchanged.
 */
export function toggleTask(tasks: Task[], id: string): Task[] {
  return tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task,
  );
}

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  switch (filter) {
    case 'all':
      return tasks.slice();
    case 'active':
      return tasks.filter((task) => !task.done);
    case 'done':
      return tasks.filter((task) => task.done);
  }
}
