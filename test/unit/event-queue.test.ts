import { describe, test, expect, beforeEach } from 'vitest';
import { EventQueue, type VBEvent } from '../../src/event-queue.js';

describe('EventQueue', () => {
  let queue: EventQueue;

  beforeEach(() => {
    queue = new EventQueue(100);
  });

  test('push adds events to queue', () => {
    queue.push({ timestamp: 1000, type: 'hmr-update', payload: {} });
    queue.push({ timestamp: 2000, type: 'error', payload: {} });

    expect(queue.all()).toHaveLength(2);
  });

  test('respects max size (circular buffer)', () => {
    const smallQueue = new EventQueue(3);

    smallQueue.push({ timestamp: 1000, type: 'hmr-update', payload: {} });
    smallQueue.push({ timestamp: 2000, type: 'hmr-update', payload: {} });
    smallQueue.push({ timestamp: 3000, type: 'hmr-update', payload: {} });
    smallQueue.push({ timestamp: 4000, type: 'hmr-update', payload: {} });

    const all = smallQueue.all();
    expect(all).toHaveLength(3);
    expect(all[0].timestamp).toBe(2000); // First event was shifted out
    expect(all[2].timestamp).toBe(4000);
  });

  test('window returns events in time range', () => {
    queue.push({ timestamp: 1000, type: 'hmr-update', payload: {} });
    queue.push({ timestamp: 2000, type: 'error', payload: {} });
    queue.push({ timestamp: 3000, type: 'network', payload: {} });
    queue.push({ timestamp: 4000, type: 'hmr-update', payload: {} });

    // Get events from last 1500ms before timestamp 3500
    const result = queue.window(1500, 3500);

    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe(2000);
    expect(result[1].timestamp).toBe(3000);
  });

  test('window with default before parameter uses current time', () => {
    const now = Date.now();
    queue.push({ timestamp: now - 1000, type: 'hmr-update', payload: {} });
    queue.push({ timestamp: now - 6000, type: 'error', payload: {} });

    const result = queue.window(5000);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('hmr-update');
  });

  test('ofType filters by event type', () => {
    queue.push({ timestamp: 1000, type: 'hmr-update', payload: {} });
    queue.push({ timestamp: 1500, type: 'store-update', payload: { store: 'main' } });
    queue.push({ timestamp: 2000, type: 'error', payload: {} });
    queue.push({ timestamp: 3000, type: 'hmr-update', payload: {} });
    queue.push({ timestamp: 4000, type: 'network', payload: {} });

    const hmrEvents = queue.ofType('hmr-update');
    const errorEvents = queue.ofType('error');
    const storeEvents = queue.ofType('store-update');

    expect(hmrEvents).toHaveLength(2);
    expect(errorEvents).toHaveLength(1);
    expect(storeEvents).toHaveLength(1);
    expect(hmrEvents[0].timestamp).toBe(1000);
    expect(hmrEvents[1].timestamp).toBe(3000);
  });

  test('all returns copy of all events', () => {
    queue.push({ timestamp: 1000, type: 'hmr-update', payload: {} });
    queue.push({ timestamp: 2000, type: 'error', payload: {} });

    const all = queue.all();

    expect(all).toHaveLength(2);

    // Verify it's a copy (modifying returned array doesn't affect queue)
    all.push({ timestamp: 3000, type: 'network', payload: {} });
    expect(queue.all()).toHaveLength(2);
  });

  test('clear removes all events', () => {
    queue.push({ timestamp: 1000, type: 'hmr-update', payload: {} });
    queue.push({ timestamp: 2000, type: 'error', payload: {} });

    expect(queue.all()).toHaveLength(2);

    queue.clear();

    expect(queue.all()).toHaveLength(0);
  });

  test('handles empty queue gracefully', () => {
    expect(queue.all()).toHaveLength(0);
    expect(queue.window(5000)).toHaveLength(0);
    expect(queue.ofType('error')).toHaveLength(0);
  });

  test('window excludes events outside time range', () => {
    queue.push({ timestamp: 1000, type: 'hmr-update', payload: {} });
    queue.push({ timestamp: 5000, type: 'error', payload: {} });
    queue.push({ timestamp: 10000, type: 'network', payload: {} });

    // Window from 4000 to 9000 (5000ms before 9000)
    const result = queue.window(5000, 9000);

    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe(5000);
  });

  test('stores payload correctly', () => {
    const payload = { path: '/src/App.vue', type: 'update' };
    queue.push({ timestamp: 1000, type: 'hmr-update', payload });

    const events = queue.all();
    expect(events[0].payload).toEqual(payload);
  });

  test('size returns the current event count', () => {
    expect(queue.size).toBe(0);
    queue.push({ timestamp: 1000, type: 'hmr-update', payload: {} });
    expect(queue.size).toBe(1);
    queue.push({ timestamp: 2000, type: 'error', payload: {} });
    expect(queue.size).toBe(2);
    queue.clear();
    expect(queue.size).toBe(0);
  });

  test('binary search window matches linear scan for large queues', () => {
    const bigQueue = new EventQueue(2000);
    const baseTime = 100000;
    for (let i = 0; i < 1000; i++) {
      bigQueue.push({ timestamp: baseTime + i * 10, type: 'hmr-update', payload: {} });
    }

    // Window: last 500ms before baseTime + 5000
    const before = baseTime + 5000;
    const windowMs = 500;
    const result = bigQueue.window(windowMs, before);

    // All events with timestamp in [baseTime+4500, baseTime+5000]
    const expected = bigQueue.all().filter(
      (e) => e.timestamp >= before - windowMs && e.timestamp <= before,
    );
    expect(result).toHaveLength(expected.length);
    expect(result.map((e) => e.timestamp)).toEqual(expected.map((e) => e.timestamp));
  });

  test('window handles events exactly at boundaries', () => {
    queue.push({ timestamp: 1000, type: 'hmr-update', payload: {} });
    queue.push({ timestamp: 2000, type: 'error', payload: {} });
    queue.push({ timestamp: 3000, type: 'network', payload: {} });

    // Window [2000, 3000] inclusive
    const result = queue.window(1000, 3000);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe(2000);
    expect(result[1].timestamp).toBe(3000);
  });
});
