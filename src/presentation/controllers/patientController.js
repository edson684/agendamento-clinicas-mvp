export const patientController = (patients, act) => ({
  register: act((a, b) => patients.register(a, b)),
  list: act((a) => patients.list(a)),
  updateContact: act((a, b) => patients.updateContact(a, b)),
});
