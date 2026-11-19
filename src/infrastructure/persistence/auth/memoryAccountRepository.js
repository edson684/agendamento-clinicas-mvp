export class MemoryAccountRepository {
  #rows = new Map(); #seq = 1;
  nextId() { return `acc-${this.#seq++}`; }
  save(a) { this.#rows.set(a.id, a); return a; }
  findById(id) { return this.#rows.get(id) ?? null; }
  findByEmail(email) { return [...this.#rows.values()].find((a) => a.email === email) ?? null; }
}
