import { toHex } from './hex.js';
export class InMemorySessionStore {
  constructor({ ttlMs = 30 * 60_000, now = () => Date.now() } = {}) { this.map = new Map(); this.ttlMs = ttlMs; this.now = now; }
  open(actor) {
    const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
    this.map.set(token, { actor, exp: this.now() + this.ttlMs });
    return token;
  }
  get(token) {
    const s = this.map.get(token);
    if (!s) return null;
    if (s.exp < this.now()) { this.map.delete(token); return null; }
    return s.actor;
  }
  close(token) { this.map.delete(token); }
}
