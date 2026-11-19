export class MemoryAuditRepository {
  #rows = [];
  append(r) { this.#rows.push(r); return r; } // append-only: protegido contra alteração/exclusão
  all() { return [...this.#rows]; }
}
