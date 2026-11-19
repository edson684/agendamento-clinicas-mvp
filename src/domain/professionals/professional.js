import { validation } from '../shared/errors.js';
export const DEFAULT_SCHEDULE = Object.freeze({ diasSemana: [1, 2, 3, 4, 5], horas: [9, 10, 11, 14] });
const pad = (n) => String(n).padStart(2, '0');
export function validateSchedule(h) {
  const okDias = Array.isArray(h?.diasSemana) && h.diasSemana.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  const okHoras = Array.isArray(h?.horas) && h.horas.every((x) => Number.isInteger(x) && x >= 0 && x <= 22);
  if (!okDias || !okHoras) throw validation('Horários habituais inválidos');
  return Object.freeze({ diasSemana: [...h.diasSemana], horas: [...h.horas] });
}
export function createProfessional({ id, nome, especialidade, horarios = DEFAULT_SCHEDULE }) {
  if (!nome?.trim() || !especialidade?.trim()) throw validation('Nome e especialidade obrigatórios');
  return Object.freeze({ id, nome: nome.trim(), especialidade: especialidade.trim(),
    horarios: validateSchedule(horarios), ativo: true });
}
/** Horários HABITUAIS do dia (a disponibilidade efetiva é calculada em Agendamentos). */
export function slotsForDate(prof, data) {
  const dow = new Date(`${data}T12:00:00`).getDay();
  if (!prof.horarios.diasSemana.includes(dow)) return [];
  return prof.horarios.horas.map((h) => ({ inicio: `${data}T${pad(h)}:00`, fim: `${data}T${pad(h + 1)}:00` }));
}
