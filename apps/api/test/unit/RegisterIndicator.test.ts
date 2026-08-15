import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterIndicator } from '../../src/application/use-cases/RegisterIndicator.js';
import { DomainError } from '../../src/domain/errors/DomainError.js';
import { InMemoryIndicatorRepository } from './InMemoryIndicatorRepository.js';

describe('RegisterIndicator (caso de uso)', () => {
  let repository: InMemoryIndicatorRepository;
  let useCase: RegisterIndicator;

  beforeEach(() => {
    repository = new InMemoryIndicatorRepository();
    useCase = new RegisterIndicator(repository);
  });

  it('persiste o indicador e retorna o DTO correspondente', async () => {
    const result = await useCase.execute({ name: 'SELIC' });

    expect(repository.items).toHaveLength(1);
    expect(result).toMatchObject({ name: 'SELIC' });
  });

  it('rejeita nome duplicado sem persistir novamente', async () => {
    await useCase.execute({ name: 'SELIC' });

    await expect(useCase.execute({ name: 'SELIC' })).rejects.toThrow(DomainError);
    expect(repository.items).toHaveLength(1);
  });
});
