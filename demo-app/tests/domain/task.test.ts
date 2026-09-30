import { describe, expect, it } from 'vitest';
import {
  addTask,
  filterTasks,
  toggleTask,
  type Task,
} from '../../src/domain/task';

function makeTasks(): Task[] {
  return [
    { id: 'a', title: 'Write tests', done: false },
    { id: 'b', title: 'Ship demo', done: true },
    { id: 'c', title: 'Read docs', done: false },
  ];
}

describe('addTask', () => {
  it('adds a task using the trimmed title', () => {
    const result = addTask([], '  Buy milk  ');

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Buy milk');
    expect(result[0].done).toBe(false);
  });

  it('generates a unique id for each added task', () => {
    const result = addTask(addTask([], 'First'), 'Second');

    expect(result[0].id).toBeTruthy();
    expect(result[1].id).toBeTruthy();
    expect(result[0].id).not.toBe(result[1].id);
  });

  it('rejects empty or whitespace-only titles', () => {
    expect(addTask([], '')).toEqual([]);
    expect(addTask([], '   ')).toEqual([]);
    expect(addTask([], '\n\t ')).toEqual([]);
  });

  it('returns a new array without mutating the original', () => {
    const original: Task[] = [];
    const result = addTask(original, 'New task');

    expect(result).not.toBe(original);
    expect(original).toHaveLength(0);
  });
});

describe('toggleTask', () => {
  it('flips only the task matching the given id', () => {
    const result = toggleTask(makeTasks(), 'a');

    expect(result.find((task) => task.id === 'a')?.done).toBe(true);
    expect(result.find((task) => task.id === 'b')?.done).toBe(true);
    expect(result.find((task) => task.id === 'c')?.done).toBe(false);
  });

  it('returns a new array without mutating the original', () => {
    const original = makeTasks();
    const result = toggleTask(original, 'a');

    expect(result).not.toBe(original);
    expect(original.find((task) => task.id === 'a')?.done).toBe(false);
  });
});

describe('filterTasks', () => {
  it('returns every task for the all filter', () => {
    expect(filterTasks(makeTasks(), 'all')).toHaveLength(3);
  });

  it('returns only the pending tasks for the active filter', () => {
    const result = filterTasks(makeTasks(), 'active');

    expect(result.map((task) => task.id)).toEqual(['a', 'c']);
  });

  it('returns only the completed tasks for the done filter', () => {
    const result = filterTasks(makeTasks(), 'done');

    expect(result.map((task) => task.id)).toEqual(['b']);
  });

  it('returns a new array for the all filter', () => {
    const original = makeTasks();
    const result = filterTasks(original, 'all');

    expect(result).not.toBe(original);
    expect(result).toEqual(original);
  });
});
