const pad = (n) => String(n).padStart(2, '0');
export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Próximos dias úteis (seg–sex) a partir de `from`, sem incluir o próprio dia. */
export function nextWeekdays(from, count) {
  const d = new Date(from), out = [];
  while (out.length < count) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) out.push(toDateStr(d)); }
  return out;
}
