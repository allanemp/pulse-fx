import type { Observation } from '../../src/domain/entities/Observation.js';
import type {
  ObservationFilter,
  ObservationRepository,
} from '../../src/domain/repositories/ObservationRepository.js';

/** Fake em memória do repositório de observações, usado apenas em testes. */
export class InMemoryObservationRepository implements ObservationRepository {
  public readonly items: Observation[] = [];

  async upsert(observation: Observation): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.indicatorId === observation.indicatorId &&
        item.date.getTime() === observation.date.getTime(),
    );

    if (index === -1) {
      this.items.push(observation);
    } else {
      this.items[index] = observation;
    }
  }

  async findMany(filter?: ObservationFilter): Promise<Observation[]> {
    return this.items.filter((item) => {
      if (filter?.indicatorId && item.indicatorId !== filter.indicatorId) return false;
      if (filter?.from && item.date.getTime() < filter.from.getTime()) return false;
      if (filter?.to && item.date.getTime() > filter.to.getTime()) return false;
      return true;
    });
  }
}
