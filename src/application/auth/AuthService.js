import { Events } from '../contracts/events.js';
import { hasPermission } from '../../domain/auth/roles.js';
import { createAccount, canLogin, registerFailure, registerSuccess } from '../../domain/auth/account.js';
import { forbidden, unauthenticated, validation } from '../../domain/shared/errors.js';

export class AuthService {
  constructor({ accounts, hasher, sessions, bus }) { Object.assign(this, { accounts, hasher, sessions, bus }); }

  async register(actor, { nome, email, senha, role, subjectId = null }) {
    await this.authorize(actor, 'user:manage');
    if (!senha || senha.length < 8) throw validation('Senha deve ter ao menos 8 caracteres');
    if (this.accounts.findByEmail(email?.toLowerCase())) throw validation('E-mail já cadastrado');
    const acc = createAccount({ id: this.accounts.nextId(), nome, email, role, subjectId,
      senhaHash: await this.hasher.hash(senha) }); // senha nunca em texto puro
    this.accounts.save(acc);
    await this.bus.publish({ name: Events.AccountCreated, ator: actor.accountId, recurso: acc.id, resultado: 'OK' });
    return acc.id;
  }

  async login({ email, senha }) {
    const acc = this.accounts.findByEmail(String(email ?? '').toLowerCase());
    const falha = async (a) => {
      await this.bus.publish({ name: Events.LoginFailed, ator: a?.id, recurso: a?.id, resultado: 'NEGADO' });
      throw unauthenticated('Credenciais inválidas ou conta bloqueada');
    };
    if (!acc || !canLogin(acc)) return falha(acc);
    if (!(await this.hasher.verify(String(senha ?? ''), acc.senhaHash))) {
      this.accounts.save(registerFailure(acc)); // limita tentativas excessivas
      return falha(acc);
    }
    this.accounts.save(registerSuccess(acc));
    const actor = { accountId: acc.id, role: acc.role, subjectId: acc.subjectId };
    const token = this.sessions.open(actor);
    await this.bus.publish({ name: Events.LoginSucceeded, ator: acc.id, recurso: acc.id, resultado: 'OK' });
    return { token, actor, nome: acc.nome }; // o token nunca é publicado em eventos
  }

  async logout(token) {
    const a = this.sessions.get(token);
    this.sessions.close(token);
    if (a) await this.bus.publish({ name: Events.Logout, ator: a.accountId, resultado: 'OK' });
  }

  actorFor(token) {
    const a = this.sessions.get(token);
    if (!a) throw unauthenticated('Sessão inválida ou expirada');
    return a;
  }

  /** RBAC no backend: aceita se o papel possui QUALQUER uma das permissões informadas. */
  async authorize(actor, ...permissions) {
    if (permissions.some((p) => hasPermission(actor.role, p))) return;
    await this.deny(actor, permissions[0], `permissão ${permissions[0]}`);
  }

  /** Negação auditada (também usada pelas verificações contextuais dos demais módulos). */
  async deny(actor, recurso, motivo) {
    await this.bus.publish({ name: Events.AccessDenied, ator: actor.accountId, recurso, resultado: 'NEGADO' });
    throw forbidden(`Acesso negado: ${motivo}`);
  }
}
