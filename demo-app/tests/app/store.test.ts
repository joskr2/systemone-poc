import { describe, expect, it, vi } from 'vitest';
import { createStore } from '../../src/app/store';
import type { Task } from '../../src/domain/task';

function makeTasks(): Task[] {
  return [
    { id: 'a', title: 'First', done: false },
    { id: 'b', title: 'Second', done: true },
  ];
}

describe('createStore', () => {
  it('starts with the provided tasks and the all filter', () => {
    const store = createStore(makeTasks());

    expect(store.getState().tasks).toHaveLength(2);
    expect(store.getState().filter).toBe('all');
  });

  it('notifies subscribers when a task is added', () => {
    const store = createStore(makeTasks());
    const listener = vi.fn();
    store.subscribe(listener);

    store.addTask('Third');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState().tasks).toHaveLength(3);
  });

  it('notifies subscribers when a task is toggled', () => {
    const store = createStore(makeTasks());
    const listener = vi.fn();
    store.subscribe(listener);

    store.toggleTask('a');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState().tasks.find((task) => task.id === 'a')?.done).toBe(
      true,
    );
  });

  it('notifies subscribers when the filter changes', () => {
    const store = createStore(makeTasks());
    const listener = vi.fn();
    store.subscribe(listener);

    store.setFilter('done');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState().filter).toBe('done');
  });

  it('stops notifying once a subscriber unsubscribes', () => {
    const store = createStore(makeTasks());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.addTask('Third');
    unsubscribe();
    store.addTask('Fourth');

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('replaces state immutably instead of mutating it in place', () => {
    const tasks = makeTasks();
    const store = createStore(tasks);

    const before = store.getState();
    store.toggleTask('a');
    const after = store.getState();

    expect(after).not.toBe(before);
    expect(after.tasks).not.toBe(before.tasks);
    expect(before.tasks.find((task) => task.id === 'a')?.done).toBe(false);
    expect(tasks.find((task) => task.id === 'a')?.done).toBe(false);
    expect(after.filter).toBe(before.filter);
  });
});
