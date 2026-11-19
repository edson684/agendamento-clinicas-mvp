export const clinicalController = (clinical, act) => ({
  list: act((a, b) => clinical.list(a, b)),
  add: act((a, b) => clinical.add(a, b)),
});
