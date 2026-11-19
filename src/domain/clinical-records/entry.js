import { validation } from '../shared/errors.js';
export const EntryTypes = Object.freeze({
  ALERGIA: 'ALERGIA', HISTORICO: 'HISTORICO', CONDICAO: 'CONDICAO', OBSERVACAO: 'OBSERVACAO',
});
// Registro imutável (append-only): preserva o histórico dos registros.
export function createEntry({ id, pacienteId, tipo, texto, autorId, quando }) {
  if (!Object.values(EntryTypes).includes(tipo)) throw validation('Tipo clínico inválido');
  if (!texto?.trim()) throw validation('Texto clínico obrigatório');
  return Object.freeze({ id, pacienteId, tipo, texto: texto.trim(), autorId, quando });
}
