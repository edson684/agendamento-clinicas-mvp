import { DomainError } from '../../application/contracts/errors.js';
/** Converte exceções de domínio em respostas {ok:false}; erros inesperados não vazam detalhes. */
export const respond = async (fn) => {
  try { return { ok: true, data: await fn() }; }
  catch (e) {
    if (e instanceof DomainError) return { ok: false, error: { code: e.code, message: e.message } };
    return { ok: false, error: { code: 'INTERNAL', message: 'Erro interno' } };
  }
};
/** Resolve a sessão (token → ator) ANTES de acionar qualquer caso de uso. */
export const withActor = (auth) => (fn) => (token, body) => respond(async () => fn(auth.actorFor(token), body));
