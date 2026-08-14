/**
 * Erro de violação de regra de negócio.
 *
 * Lançado exclusivamente pela camada de domínio/aplicação. A camada de
 * apresentação sabe traduzi-lo para uma resposta HTTP 422 (ver
 * `errorHandler`), sem que o domínio precise conhecer o protocolo de
 * transporte.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
