import { createStore } from './app/store';
import { renderApp } from './ui/render';

const store = createStore([]);
const rootElement = document.querySelector<HTMLDivElement>('#app');

if (!rootElement) {
  throw new Error('Missing #app root element');
}

const root: HTMLDivElement = rootElement;

function render(): void {
  root.innerHTML = renderApp(store.getState());
}

store.subscribe(render);

root.addEventListener('submit', (event) => {
  if (!(event.target instanceof HTMLFormElement)) {
    return;
  }

  event.preventDefault();

  const input = root.querySelector<HTMLInputElement>('#new-task-title');
  if (!input) {
    return;
  }

  store.addTask(input.value);
  input.value = '';
});

root.addEventListener('change', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') {
    return;
  }

  const id = target.dataset.id;
  if (id) {
    store.toggleTask(id);
  }
});

root.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const filter = target.dataset.filter;
  if (filter === 'all' || filter === 'active' || filter === 'done') {
    store.setFilter(filter);
  }
});

render();
