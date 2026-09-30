import {
  addTask as addTaskToTasks,
  toggleTask as toggleTaskInTasks,
  type Task,
  type TaskFilter,
} from '../domain/task';

export interface AppState {
  tasks: Task[];
  filter: TaskFilter;
}

export interface Store {
  getState(): AppState;
  subscribe(listener: () => void): () => void;
  addTask(title: string): void;
  toggleTask(id: string): void;
  setFilter(filter: TaskFilter): void;
}

/**
 * Minimal observable store. State is always replaced with a new object and
 * every mutation notifies all current subscribers.
 */
export function createStore(initial: Task[]): Store {
  let state: AppState = { tasks: initial, filter: 'all' };
  const listeners = new Set<() => void>();

  function setState(next: AppState): void {
    state = next;
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    getState() {
      return state;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    addTask(title) {
      setState({ ...state, tasks: addTaskToTasks(state.tasks, title) });
    },

    toggleTask(id) {
      setState({ ...state, tasks: toggleTaskInTasks(state.tasks, id) });
    },

    setFilter(filter) {
      setState({ ...state, filter });
    },
  };
}
