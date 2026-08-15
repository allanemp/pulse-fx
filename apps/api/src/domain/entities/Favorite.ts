import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError.js';

export interface FavoriteProps {
  id: string;
  indicatorId: string;
  createdAt: Date;
}

/**
 * Entidade de domínio que marca um indicador como favorito.
 *
 * Sem sistema de usuários no projeto, é um estado global por indicador (não
 * por usuário) — a própria existência do registro já é o "favoritado".
 */
export class Favorite {
  private constructor(private readonly props: FavoriteProps) {}

  static create(input: { indicatorId: string }): Favorite {
    if (input.indicatorId.trim().length === 0) {
      throw new DomainError('indicatorId é obrigatório.');
    }

    return new Favorite({
      id: randomUUID(),
      indicatorId: input.indicatorId,
      createdAt: new Date(),
    });
  }

  /** Reidrata uma entidade a partir de dados já persistidos e validados. */
  static restore(props: FavoriteProps): Favorite {
    return new Favorite(props);
  }

  get id(): string {
    return this.props.id;
  }

  get indicatorId(): string {
    return this.props.indicatorId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
