export const auditController = (audit, act) => ({ list: act((a) => audit.list(a)) });
