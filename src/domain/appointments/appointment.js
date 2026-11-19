import { conflict } from '../shared/errors.js';
import { Status, assertTransition, isActiveStatus } from './status.js';
export const createAppointment = ({ id, pacienteId, profissionalId, inicio, fim }) =>
  Object.freeze({ id, pacienteId, profissionalId, inicio, fim, status: Status.AGENDADA });
export function transition(appt, to) {
  assertTransition(appt.status, to);
  return Object.freeze({ ...appt, status: to });
}
export function reschedule(appt, { inicio, fim }) {
  if (!isActiveStatus(appt.status)) throw conflict('Só consultas ativas podem ser remarcadas');
  return Object.freeze({ ...appt, inicio, fim });
}
