import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CachedQueryWithInput } from '../../src/infrastructure/cache/CachedQueryWithInput.js';
import { FakeCache } from './FakeCache.js';

describe('CachedQueryWithInput (decorator de cache-aside, com input)', () => {
  let cache: FakeCache;

  beforeEach(() => {
    cache = new FakeCache();
  });

  it('cacheia por chave derivada do input — inputs diferentes não colidem', async () => {
    const query = { execute: vi.fn((input: { id: string }) => Promise.resolve(`valor-${input.id}`)) };
    const cachedQuery = new CachedQueryWithInput(query, cache, (input) => `key:${input.id}`, 60);

    const resultA = await cachedQuery.execute({ id: 'a' });
    const resultB = await cachedQuery.execute({ id: 'b' });

    expect(resultA).toBe('valor-a');
    expect(resultB).toBe('valor-b');
    expect(query.execute).toHaveBeenCalledTimes(2);
  });

  it('cache hit no mesmo input não chama a query real de novo', async () => {
    const query = { execute: vi.fn((input: { id: string }) => Promise.resolve(`valor-${input.id}`)) };
    const cachedQuery = new CachedQueryWithInput(query, cache, (input) => `key:${input.id}`, 60);

    await cachedQuery.execute({ id: 'a' });
    await cachedQuery.execute({ id: 'a' });

    expect(query.execute).toHaveBeenCalledTimes(1);
  });
});
