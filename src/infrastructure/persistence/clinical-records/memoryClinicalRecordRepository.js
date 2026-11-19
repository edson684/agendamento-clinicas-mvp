export class MemoryClinicalRecordRepository {
  #rows = []; #seq = 1;
  nextId() { return `c-${this.#seq++}`; }
  append(e) { this.#rows.push(e); return e; } // append-only: sem update/delete
  byPatient(pacienteId) { return this.#rows.filter((e) => e.pacienteId === pacienteId); }
}
