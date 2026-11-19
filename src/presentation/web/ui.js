// CAMADA DE APRESENTAÇÃO (web): só conversa com os controllers e com contratos da aplicação.
import { nextWeekdays } from '../../application/contracts/dates.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (i) => `${i.slice(8, 10)}/${i.slice(5, 7)} ${i.slice(11, 16)}`;
const opts = (a, sel, label) => a.map((x) => `<option value="${esc(x.id)}" ${x.id === sel ? 'selected' : ''}>${esc(label(x))}</option>`).join('');
const TABS = { paciente: ['Agendar', 'Consultas', 'Avisos'], recepcionista: ['Agendar', 'Consultas', 'Pacientes', 'Avisos'],
  profissional: ['Consultas', 'Clínico'], administrador: ['Auditoria'] };

export function mountUi(root, api, { users, senha, manifest }) {
  const S = { me: null, tab: null, pro: null, day: nextWeekdays(new Date(), 1)[0], pat: null, open: null, arch: false, msg: null };
  const t = () => S.me.token;
  const call = async (p) => { const r = await p; if (!r.ok) { S.msg = { bad: true, text: r.error.message }; return null; } return r.data; };
  const ok = (text) => { S.msg = { text }; };

  const views = {
    async Agendar() {
      const pros = (await call(api.professionals.list(t()))) ?? [];
      S.pro ??= pros[0]?.id;
      const slots = S.pro ? (await call(api.appointments.availableSlots(t(), { profissionalId: S.pro, data: S.day }))) ?? [] : [];
      const pats = S.me.role === 'recepcionista' ? (await call(api.patients.list(t()))) ?? [] : [];
      if (pats.length) S.pat ??= pats[0].id;
      const days = nextWeekdays(new Date(), 5);
      return `<div class="c"><select data-s="pro">${opts(pros, S.pro, (p) => `${p.nome} · ${p.especialidade}`)}</select>
        <select data-s="day">${days.map((d) => `<option value="${d}" ${d === S.day ? 'selected' : ''}>${d.slice(8)}/${d.slice(5, 7)}</option>`).join('')}</select>
        ${pats.length ? `<select data-s="pat">${opts(pats, S.pat, (p) => p.nome)}</select>` : ''}
        <h2>Horários livres</h2>${slots.map((s) => `<button data-a="book" data-i="${s.inicio}" data-f="${s.fim}">${s.inicio.slice(11, 16)}</button>`).join('') || '<span class="m">Sem horários livres.</span>'}</div>`;
    },
    async Consultas() {
      const l = (await call(api.appointments.list(t()))) ?? [];
      const r = S.me.role;
      return `<div class="sc"><table><tr><th>Quando</th><th>Paciente</th><th>Profissional</th><th>Estado</th><th></th></tr>${l.map((a) => {
        const live = a.status === 'AGENDADA' || a.status === 'CONFIRMADA';
        const b = [];
        if (live && r !== 'profissional') b.push(['cancel', 'Cancelar'], ['resch', 'Remarcar']);
        if (a.status === 'AGENDADA' && r === 'recepcionista') b.push(['confirm', 'Confirmar']);
        if (a.status === 'CONFIRMADA' && r === 'profissional') b.push(['complete', 'Concluir']);
        return `<tr><td>${fmt(a.inicio)}</td><td>${esc(a.pacienteNome)}</td><td>${esc(a.profissionalNome)}</td><td>${a.status}</td>
          <td>${b.map(([k, n]) => `<button data-a="${k}" data-id="${a.id}" data-p="${a.profissionalId}">${n}</button>`).join('')}</td></tr>`;
      }).join('') || '<tr><td class="m">Nenhuma consulta.</td></tr>'}</table></div>`;
    },
    async Pacientes() {
      const l = (await call(api.patients.list(t()))) ?? [];
      return `<div class="c"><input id="pn" placeholder="Nome"> <input id="pt" placeholder="Telefone"> <button class="p" data-a="reg">Cadastrar</button>
        <p class="m">Apenas dados cadastrais; nada clínico neste módulo.</p>${l.map((p) => `<div>${esc(p.nome)}</div>`).join('')}</div>`;
    },
    async Clínico() {
      const pats = (await call(api.patients.list(t()))) ?? [];
      let body = '';
      if (S.open) {
        const regs = await call(api.clinicalRecords.list(t(), { pacienteId: S.open }));
        body = regs ? `<div class="c"><b>${esc(pats.find((p) => p.id === S.open)?.nome)}</b>${regs.map((e) => `<div>• [${e.tipo}] ${esc(e.texto)}</div>`).join('') || '<div class="m">Sem registros.</div>'}
          <select id="ct"><option>OBSERVACAO</option><option>ALERGIA</option><option>HISTORICO</option><option>CONDICAO</option></select>
          <textarea id="cx" rows="2" placeholder="Nova observação"></textarea><button class="p" data-a="note">Salvar</button></div>` : '';
      }
      return `<div class="c">${pats.map((p) => `<button data-a="open" data-id="${p.id}">${esc(p.nome)}</button>`).join('')}</div>${body}`;
    },
    async Avisos() {
      const l = (await call(api.notifications.list(t()))) ?? [];
      return `<div class="sc"><table>${l.map((n) => `<tr><td>${esc(n.texto)}</td><td>${n.status}</td></tr>`).join('') || '<tr><td class="m">Sem avisos.</td></tr>'}</table></div>`;
    },
    async Auditoria() {
      const l = (await call(api.audit.list(t()))) ?? [];
      return `<div class="sc"><table><tr><th>Hora</th><th>Evento</th><th>Ator</th><th>Recurso</th><th></th></tr>${l.slice(0, 80).map((r) => `<tr><td>${r.quando.slice(11, 19)}</td><td>${r.evento}</td><td>${r.ator}</td><td>${r.recurso}</td><td class="${r.resultado === 'NEGADO' ? 'bad' : 'ok'}">${r.resultado}</td></tr>`).join('')}</table></div>`;
    },
  };

  const arch = () => `<div class="c"><b>Dependências permitidas entre módulos</b>${Object.entries(manifest).map(([k, v]) => `<div>${k} → <span class="m">${v.join(', ') || '(nenhuma)'}</span></div>`).join('')}
    <p class="m">Agendamentos → Notificações/Auditoria: somente por eventos. Veja README e <code>npm test</code>.</p></div>`;

  async function render() {
    let html;
    if (!S.me) {
      html = `<div class="c"><h2>Entrar</h2><select id="lu">${users.map((u) => `<option value="${u.email}">${esc(u.nome)}</option>`).join('')}</select>
        <input id="lp" type="password" value="${senha}"> <button class="p" data-a="login">Entrar</button><p class="m">Senha de demonstração: ${senha}</p></div>`;
    } else {
      const tabs = TABS[S.me.role];
      if (!tabs.includes(S.tab)) S.tab = tabs[0];
      const body = S.arch ? arch() : await views[S.tab]();
      html = `<div class="c">${esc(S.me.nome)} <span class="m">(${S.me.role})</span> <button data-a="logout">Sair</button> <button data-a="arch">Arquitetura</button></div>
        <div class="tabs">${tabs.map((x) => `<button class="${x === S.tab && !S.arch ? 'on' : ''}" data-a="tab" data-id="${x}">${x}</button>`).join('')}</div>${body}`;
    }
    const m = S.msg; S.msg = null;
    root.innerHTML = (m ? `<div class="toast ${m.bad ? 'bad' : 'okm'}">${esc(m.text)}</div>` : '') + html;
  }

  root.addEventListener('change', (e) => { const k = e.target.dataset.s; if (k) { S[k] = e.target.value; render(); } });
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a, id = b.dataset.id, v = (x) => root.querySelector('#' + x).value;
    if (a === 'login') { const d = await call(api.auth.login({ email: v('lu'), senha: v('lp') })); if (d) { S.me = d; S.tab = null; S.arch = false; } }
    else if (a === 'logout') { await api.auth.logout(t()); S.me = null; S.open = null; }
    else if (a === 'tab') { S.tab = id; S.arch = false; S.open = null; }
    else if (a === 'arch') S.arch = !S.arch;
    else if (a === 'book') { const d = await call(api.appointments.book(t(), { pacienteId: S.me.role === 'paciente' ? S.me.subjectId : S.pat, profissionalId: S.pro, inicio: b.dataset.i, fim: b.dataset.f })); if (d) ok('Consulta agendada.'); }
    else if (['cancel', 'confirm', 'complete'].includes(a)) { if (await call(api.appointments[a](t(), { agendamentoId: id })) !== null || true) ok('Operação concluída.'); }
    else if (a === 'resch') {
      for (const day of nextWeekdays(new Date(), 5)) {
        const free = (await call(api.appointments.availableSlots(t(), { profissionalId: b.dataset.p, data: day }))) ?? [];
        if (free.length) { const r = await api.appointments.reschedule(t(), { agendamentoId: id, novoInicio: free[0].inicio, novoFim: free[0].fim });
          S.msg = r.ok ? { text: `Remarcada para ${fmt(free[0].inicio)}.` } : { bad: true, text: r.error.message }; break; }
      }
    }
    else if (a === 'reg') { if (await call(api.patients.register(t(), { nome: v('pn'), telefone: v('pt') })) !== null) ok('Paciente cadastrado.'); }
    else if (a === 'open') S.open = id;
    else if (a === 'note') { if (await call(api.clinicalRecords.add(t(), { pacienteId: S.open, tipo: v('ct'), texto: v('cx') })) !== null) ok('Registro salvo.'); }
    render();
  });
  render();
}
