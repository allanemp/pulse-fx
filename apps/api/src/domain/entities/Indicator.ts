import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError.js';

export interface IndicatorProps {
  id: string;
  name: string;
  unit?: string | undefined;
  description?: string | undefined;
  source?: string | undefined;
  sourceEndpoint?: string | undefined;
  createdAt: Date;
}

const MAX_NAME_LENGTH = 120;

/**
 * Entidade de domínio que representa um indicador cadastrado no catálogo
 * (ex.: SELIC, IPCA) — o "o quê" de uma série temporal de `Observation`.
 *
 * `unit` é a unidade/moeda de exibição do valor (ex.: "% a.a.", "BRL").
 * `description` explica o que é a série, a fonte original e ressalvas sobre
 * os dados — texto livre, pensado para aparecer na tela de detalhes.
 *
 * `source` + `sourceEndpoint` juntos dizem como sincronizar automaticamente
 * este indicador: `source` identifica QUAL `IndicatorDataSource` sabe
 * interpretar a fonte (ex.: `"bcb-sgs"`, `"bcb-ptax"` — ver
 * `IndicatorDataSourceRegistry`), `sourceEndpoint` é o dado que essa
 * implementação específica precisa (o significado varia por fonte: para o
 * SGS é um complemento de URL, para o PTAX é uma data de início). Os dois
 * sempre vêm juntos — um indicador sem fonte configurada não tem nenhum
 * dos dois; não faz sentido ter só um.
 *
 * Se um indicador está favoritado NÃO é uma propriedade desta entidade — é
 * um fato sobre outra tabela (`Favorite`), resolvido pela camada de
 * aplicação ao montar o DTO, não pelo próprio indicador.
 */
export class Indicator {
  private constructor(private readonly props: IndicatorProps) {}

  static create(input: {
    name: string;
    unit?: string | undefined;
    description?: string | undefined;
    source?: string | undefined;
    sourceEndpoint?: string | undefined;
  }): Indicator {
    const name = input.name.trim();
    const unit = input.unit?.trim() || undefined;
    const description = input.description?.trim() || undefined;
    const source = input.source?.trim() || undefined;
    const sourceEndpoint = input.sourceEndpoint?.trim() || undefined;

    if (name.length === 0) {
      throw new DomainError('O nome do indicador não pode ser vazio.');
    }

    if (name.length > MAX_NAME_LENGTH) {
      throw new DomainError(
        `O nome do indicador deve ter no máximo ${MAX_NAME_LENGTH} caracteres.`,
      );
    }

    if (Boolean(source) !== Boolean(sourceEndpoint)) {
      throw new DomainError(
        'source e sourceEndpoint devem ser informados juntos, ou nenhum dos dois.',
      );
    }

    return new Indicator({
      id: randomUUID(),
      name,
      unit,
      description,
      source,
      sourceEndpoint,
      createdAt: new Date(),
    });
  }

  /** Reidrata uma entidade a partir de dados já persistidos e validados. */
  static restore(props: IndicatorProps): Indicator {
    return new Indicator(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get unit(): string | undefined {
    return this.props.unit;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get source(): string | undefined {
    return this.props.source;
  }

  get sourceEndpoint(): string | undefined {
    return this.props.sourceEndpoint;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
