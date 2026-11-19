/** Barramento interno do monólito (sem fila distribuída nesta etapa). Falha de consumidor não derruba o produtor. */
export class InMemoryEventBus {
  constructor({ now = () => new Date() } = {}) { this.subs = new Map(); this.now = now; this.failures = []; }
  subscribe(name, handler) {
    if (!this.subs.has(name)) this.subs.set(name, []);
    this.subs.get(name).push(handler);
  }
  async publish(event) {
    const e = Object.freeze({ ...event, quando: this.now().toISOString() });
    const handlers = [...(this.subs.get(e.name) ?? []), ...(this.subs.get('*') ?? [])];
    const results = await Promise.allSettled(handlers.map((h) => h(e)));
    results.forEach((r) => { if (r.status === 'rejected') this.failures.push({ evento: e.name, erro: String(r.reason?.message ?? r.reason) }); });
    return e;
  }
}
