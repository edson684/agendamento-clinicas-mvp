import { validation } from '../shared/errors.js';
// Somente dados CADASTRAIS (nada clínico aqui — decisão do módulo 2).
export function createPatient({ id, nome, telefone, email = '' }) {
  if (!nome?.trim()) throw validation('Nome obrigatório');
  const tel = String(telefone ?? '').replace(/\D/g, '');
  if (tel.length < 10) throw validation('Telefone inválido');
  return Object.freeze({ id, nome: nome.trim(), telefone: tel, email, ativo: true });
}
export const updateContact = (p, { telefone, email }) =>
  createPatient({ ...p, telefone: telefone ?? p.telefone, email: email ?? p.email });
