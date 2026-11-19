import { toHex, fromHex } from './hex.js';
const enc = new TextEncoder();
async function derive(senha, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  return toHex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}
/** Hash com sal aleatório (PBKDF2-SHA256, Web Crypto: roda em Node e no navegador). */
export class Pbkdf2PasswordHasher {
  constructor({ iterations = 100_000 } = {}) { this.iterations = iterations; }
  async hash(senha) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return `pbkdf2$${this.iterations}$${toHex(salt)}$${await derive(senha, salt, this.iterations)}`;
  }
  async verify(senha, stored) {
    const [, it, salt, h] = stored.split('$');
    const d = await derive(senha, fromHex(salt), Number(it));
    let diff = d.length ^ h.length;
    for (let i = 0; i < d.length; i++) diff |= d.charCodeAt(i) ^ (h.charCodeAt(i) || 0); // comparação em tempo constante
    return diff === 0;
  }
}
