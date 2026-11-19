import { createApp } from '../src/main.js';
import { seedDemo, DEMO_PASSWORD } from '../src/seed.js';

export async function makeApp(opts = {}) {
  const app = createApp({ hasherIterations: 1000, ...opts });
  await seedDemo(app);
  const events = []; // todos os eventos publicados (para provar ordem e ausência de eventos)
  app.bus.subscribe('*', (e) => events.push(e));
  const as = async (email) => (await app.services.auth.login({ email, senha: DEMO_PASSWORD })).actor;
  return { app, s: app.services, events, as };
}
export class FlakyChannel {
  constructor(failTimes) { this.failTimes = failTimes; this.calls = 0; }
  async send() { this.calls++; return { ok: this.calls > this.failTimes }; }
}
export const slot = (data, h) => ({ inicio: `${data}T${String(h).padStart(2, '0')}:00`, fim: `${data}T${String(h + 1).padStart(2, '0')}:00` });
