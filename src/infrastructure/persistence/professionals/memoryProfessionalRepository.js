export class MemoryProfessionalRepository {
  #rows = new Map(); #seq = 1;
  nextId() { return `r-${this.#seq++}`; }
  save(p) { this.#rows.set(p.id, p); return p; }
  findById(id) { return this.#rows.get(id) ?? null; }
  all() { return [...this.#rows.values()]; }
}
