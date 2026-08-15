import type { Indicator } from '../../src/domain/entities/Indicator.js';
import type { IndicatorRepository } from '../../src/domain/repositories/IndicatorRepository.js';

/** Fake em memória do repositório de indicadores, usado apenas em testes. */
export class InMemoryIndicatorRepository implements IndicatorRepository {
  public readonly items: Indicator[] = [];

  async save(indicator: Indicator): Promise<void> {
    this.items.push(indicator);
  }

  async findById(id: string): Promise<Indicator | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async findByName(name: string): Promise<Indicator | null> {
    return this.items.find((item) => item.name === name) ?? null;
  }

  async findMany(): Promise<Indicator[]> {
    return [...this.items];
  }

  async findSyncable(): Promise<Indicator[]> {
    return this.items.filter((item) => item.sourceEndpoint !== undefined);
  }
}
