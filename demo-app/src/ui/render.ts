import { filterTasks, type Task, type TaskFilter } from '../domain/task';

export interface RenderState {
  tasks: Task[];
  filter: TaskFilter;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Returns the full app markup as a string. Pure: given the same state it
 * always produces the same HTML and never touches the DOM.
 */
export function renderApp(state: RenderState): string {
  const visibleTasks = filterTasks(state.tasks, state.filter);

  const items = visibleTasks
    .map((task) => {
      const checked = task.done ? ' checked' : '';
      const doneClass = task.done ? ' class="done"' : '';
      return `<li${doneClass}><label><input type="checkbox" data-id="${escapeHtml(task.id)}"${checked}><span>${escapeHtml(task.title)}</span></label></li>`;
    })
    .join('');

  const filterButton = (filter: TaskFilter, label: string): string => {
    const pressed = state.filter === filter ? 'true' : 'false';
    return `<button type="button" class="filter" data-filter="${filter}" aria-pressed="${pressed}">${label}</button>`;
  };

  return `
    <h1>Task List</h1>
    <form id="add-form">
      <input id="new-task-title" type="text" placeholder="What needs to be done?" autocomplete="off">
      <button id="add-task" type="submit">Add</button>
    </form>
    <ul id="task-list">${items}</ul>
    <p id="task-count">${visibleTasks.length} tasks</p>
    <div class="filters">
      ${filterButton('all', 'All')}
      ${filterButton('active', 'Active')}
      ${filterButton('done', 'Done')}
    </div>
  `;
}
