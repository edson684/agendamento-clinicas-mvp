export const professionalController = (professionals, act) => ({
  register: act((a, b) => professionals.register(a, b)),
  list: act((a) => professionals.list(a)),
  updateSchedule: act((a, b) => professionals.updateSchedule(a, b)),
});
