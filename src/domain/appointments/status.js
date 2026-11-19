import { conflict } from '../shared/errors.js';
// Conascência de Convenção tratada: o significado dos estados é central e explícito.
export const Status = Object.freeze({
  AGENDADA: 'AGENDADA', CONFIRMADA: 'CONFIRMADA', CANCELADA: 'CANCELADA', CONCLUIDA: 'CONCLUIDA',
});
const NEXT = {
  [Status.AGENDADA]: [Status.CONFIRMADA, Status.CANCELADA],
  [Status.CONFIRMADA]: [Status.CONCLUIDA, Status.CANCELADA],
  [Status.CANCELADA]: [], [Status.CONCLUIDA]: [],
};
export const canTransition = (from, to) => NEXT[from]?.includes(to) ?? false;
export const isActiveStatus = (s) => s === Status.AGENDADA || s === Status.CONFIRMADA;
export const assertTransition = (from, to) => {
  if (!canTransition(from, to)) throw conflict(`Transição inválida: ${from} → ${to}`);
};
