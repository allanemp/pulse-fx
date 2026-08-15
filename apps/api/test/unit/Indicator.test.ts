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

  it('aceita source e sourceEndpoint informados juntos', () => {
    const indicator = Indicator.create({
      name: 'SELIC',
      source: 'bcb-sgs',
      sourceEndpoint: '/dados/serie/bcdata.sgs.4390/dados?formato=json',
    });

    expect(indicator.source).toBe('bcb-sgs');
    expect(indicator.sourceEndpoint).toBe('/dados/serie/bcdata.sgs.4390/dados?formato=json');
  });

  it('rejeita source sem sourceEndpoint', () => {
    expect(() => Indicator.create({ name: 'SELIC', source: 'bcb-sgs' })).toThrow(DomainError);
  });

  it('rejeita sourceEndpoint sem source', () => {
    expect(() =>
      Indicator.create({ name: 'SELIC', sourceEndpoint: '/dados/serie/bcdata.sgs.4390/dados' }),
    ).toThrow(DomainError);
  });
});
