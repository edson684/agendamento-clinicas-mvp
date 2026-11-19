/** Disponibilidade efetiva = horários habituais − reservas ativas − horários passados. */
export function freeSlots(habituais, inicioReservados, agora) {
  const ocupados = new Set(inicioReservados);
  return habituais.filter((s) => !ocupados.has(s.inicio) && new Date(s.inicio) > agora);
}
