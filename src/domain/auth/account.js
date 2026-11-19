import { validation } from '../shared/errors.js';
import { Roles } from './roles.js';
export const MAX_ATTEMPTS = 5;
export function createAccount({ id, nome, email, role, subjectId = null, senhaHash }) {
  if (!nome?.trim()) throw validation('Nome obrigatório');
  if (!/^\S+@\S+\.\S+$/.test(email ?? '')) throw validation('E-mail inválido');
  if (!Object.values(Roles).includes(role)) throw validation('Papel inválido');
  if (!senhaHash) throw validation('Senha obrigatória');
  return Object.freeze({ id, nome: nome.trim(), email: email.toLowerCase(), role, subjectId,
    senhaHash, ativa: true, bloqueada: false, tentativas: 0 });
}
export const canLogin = (a) => a.ativa && !a.bloqueada;
export const registerFailure = (a) =>
  Object.freeze({ ...a, tentativas: a.tentativas + 1, bloqueada: a.tentativas + 1 >= MAX_ATTEMPTS });
export const registerSuccess = (a) => Object.freeze({ ...a, tentativas: 0 });
