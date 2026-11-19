import { validation } from '../../domain/shared/errors.js';
// Conascência de POSIÇÃO eliminada: contratos com campos NOMEADOS (objeto), não parâmetros posicionais.
const need = (o, keys) => {
  for (const k of keys) if (o?.[k] === undefined || o[k] === null || o[k] === '') throw validation(`Campo obrigatório: ${k}`);
};
export function CriarAgendamentoRequest(o = {}) {
  need(o, ['pacienteId', 'profissionalId', 'inicio', 'fim']);
  if (o.fim <= o.inicio) throw validation('O fim deve ser posterior ao início');
  return Object.freeze({ pacienteId: o.pacienteId, profissionalId: o.profissionalId, inicio: o.inicio, fim: o.fim });
}
export function RemarcarAgendamentoRequest(o = {}) {
  need(o, ['agendamentoId', 'novoInicio', 'novoFim']);
  if (o.novoFim <= o.novoInicio) throw validation('O fim deve ser posterior ao início');
  return Object.freeze({ agendamentoId: o.agendamentoId, novoInicio: o.novoInicio, novoFim: o.novoFim });
}
export function AgendamentoIdRequest(o = {}) {
  need(o, ['agendamentoId']);
  return Object.freeze({ agendamentoId: o.agendamentoId });
}
export function ConsultaDisponibilidadeRequest(o = {}) {
  need(o, ['profissionalId', 'data']);
  return Object.freeze({ profissionalId: o.profissionalId, data: o.data });
}
