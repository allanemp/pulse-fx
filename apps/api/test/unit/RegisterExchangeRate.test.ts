import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterExchangeRate } from '../../src/application/use-cases/RegisterExchangeRate.js';
import { DomainError } from '../../src/domain/errors/DomainError.js';
import { InMemoryExchangeRateRepository } from './InMemoryExchangeRateRepository.js';

describe('RegisterExchangeRate (caso de uso)', () => {
  let repository: InMemoryExchangeRateRepository;
  let useCase: RegisterExchangeRate;

  beforeEach(() => {
    repository = new InMemoryExchangeRateRepository();
    useCase = new RegisterExchangeRate(repository);
  });

  it('persiste a cotação e retorna o DTO correspondente', async () => {
    const result = await useCase.execute({
      baseCurrency: 'USD',
      quoteCurrency: 'BRL',
      rate: 5.42,
    });

    expect(repository.items).toHaveLength(1);
    expect(result).toMatchObject({ baseCurrency: 'USD', quoteCurrency: 'BRL', rate: 5.42 });
    expect(result.id).toBeTruthy();
  });

  it('propaga erro de domínio sem persistir nada', async () => {
    await expect(
      useCase.execute({ baseCurrency: 'USD', quoteCurrency: 'BRL', rate: -1 }),
    ).rejects.toThrow(DomainError);

    expect(repository.items).toHaveLength(0);
  });
});
