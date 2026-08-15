import { describe, expect, it } from 'vitest';
import { Indicator } from '../../src/domain/entities/Indicator.js';
import { DomainError } from '../../src/domain/errors/DomainError.js';

describe('Indicator (entidade de domínio)', () => {
  it('cria um indicador válido normalizando espaços do nome', () => {
    const indicator = Indicator.create({ name: '  SELIC  ' });

    expect(indicator.name).toBe('SELIC');
    expect(indicator.id).toBeTruthy();
  });

  it('rejeita nome vazio', () => {
    expect(() => Indicator.create({ name: '   ' })).toThrow(DomainError);
  });

  it('rejeita nome maior que 120 caracteres', () => {
    expect(() => Indicator.create({ name: 'a'.repeat(121) })).toThrow(DomainError);
  });
});
