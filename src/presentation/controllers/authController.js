import { respond } from './handle.js';
export const authController = ({ auth }) => ({
  login: (body) => respond(async () => {
    const r = await auth.login({ email: body?.email, senha: body?.senha });
    return { token: r.token, nome: r.nome, role: r.actor.role, subjectId: r.actor.subjectId };
  }),
  logout: (token) => respond(() => auth.logout(token)),
});
