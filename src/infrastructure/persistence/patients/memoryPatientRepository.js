export class MemoryPatientRepository {
  #rows = new Map(); #seq = 1;
  nextId() { return `p-${this.#seq++}`; }
  save(p) { this.#rows.set(p.id, p); return p; }
  findById(id) { return this.#rows.get(id) ?? null; }
  all() { return [...this.#rows.values()]; }
}
