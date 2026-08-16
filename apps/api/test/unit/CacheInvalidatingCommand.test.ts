import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheInvalidatingCommand } from '../../src/infrastructure/cache/CacheInvalidatingCommand.js';
import { FakeCache } from './FakeCache.js';

describe('CacheInvalidatingCommand (decorator de invalidação de cache)', () => {
  let cache: FakeCache;

  beforeEach(() => {
    cache = new FakeCache();
  });

  it('executa o comando real e devolve o resultado normalmente', async () => {
    const command = { execute: vi.fn().mockResolvedValue({ id: '1' }) };
    const invalidatingCommand = new CacheInvalidatingCommand(command, cache, () => 'prefixo:');

    const result = await invalidatingCommand.execute({ any: 'input' });

    expect(result).toEqual({ id: '1' });
    expect(command.execute).toHaveBeenCalledWith({ any: 'input' });
  });

  it('invalida (remove) todas as chaves com o prefixo derivado do input', async () => {
    await cache.set('observations:abc:', ['x']);
    await cache.set('observations:abc:2026-01-01', ['y']);
    await cache.set('observations:outro-indicador:', ['z']);

    const command = { execute: vi.fn().mockResolvedValue(undefined) };
    const invalidatingCommand = new CacheInvalidatingCommand<{ indicatorId: string }, void>(
      command,
      cache,
      (input) => `observations:${input.indicatorId}:`,
    );

    await invalidatingCommand.execute({ indicatorId: 'abc' });

    expect(cache.has('observations:abc:')).toBe(false);
    expect(cache.has('observations:abc:2026-01-01')).toBe(false);
    expect(cache.has('observations:outro-indicador:')).toBe(true);
  });

  it('não invalida nada se o comando real lançar erro', async () => {
    await cache.set('prefixo:chave', ['valor']);

    const command = { execute: vi.fn().mockRejectedValue(new Error('falhou')) };
    const invalidatingCommand = new CacheInvalidatingCommand(command, cache, () => 'prefixo:');

    await expect(invalidatingCommand.execute({})).rejects.toThrow('falhou');
    expect(cache.has('prefixo:chave')).toBe(true);
  });
});
