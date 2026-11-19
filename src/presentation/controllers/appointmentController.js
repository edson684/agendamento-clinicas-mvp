export const appointmentController = (appointments, act) => ({
  availableSlots: act((a, b) => appointments.availableSlots(a, b)),
  book: act((a, b) => appointments.book(a, b)),
  cancel: act((a, b) => appointments.cancel(a, b)),
  confirm: act((a, b) => appointments.confirm(a, b)),
  complete: act((a, b) => appointments.complete(a, b)),
  reschedule: act((a, b) => appointments.reschedule(a, b)),
  list: act((a) => appointments.list(a)),
});
