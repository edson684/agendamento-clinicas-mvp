import { conflict } from '../../../domain/shared/errors.js';
import { isActiveStatus } from '../../../domain/appointments/status.js';

export class MemoryAppointmentRepository {
  #rows = new Map(); #seq = 1;
  nextId() { return `a-${this.#seq++}`; }
  findById(id) { return this.#rows.get(id) ?? null; }
  all() { return [...this.#rows.values()]; }
  startsOf(profissionalId) {
    return this.all().filter((a) => a.profissionalId === profissionalId && isActiveStatus(a.status)).map((a) => a.inicio);
  }
  #taken(a, ignoreId) {
    return this.all().some((o) => o.id !== ignoreId && o.profissionalId === a.profissionalId
      && o.inicio === a.inicio && isActiveStatus(o.status));
  }
  /** Equivale a UNIQUE(profissional_id, inicio) para consultas ativas. Verificação + gravação síncronas = atômicas;
   *  num banco real seria uma transação com a mesma restrição (ex.: índice único parcial). */
  reserve(a) {
    if (this.#taken(a)) throw conflict('Horário já reservado para este profissional');
    this.#rows.set(a.id, a);
    return a;
  }
  move(a) {
    if (this.#taken(a, a.id)) throw conflict('Horário já reservado para este profissional');
    this.#rows.set(a.id, a);
    return a;
  }
  update(a) { this.#rows.set(a.id, a); return a; }
}
