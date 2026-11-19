export class MemoryNotificationRepository {
  #rows = new Map(); #seq = 1;
  nextId() { return `n-${this.#seq++}`; }
  save(n) { this.#rows.set(n.id, n); return n; }
  all() { return [...this.#rows.values()].reverse(); }
  byPatient(pacienteId) { return this.all().filter((n) => n.pacienteId === pacienteId); }
}
