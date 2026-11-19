export const notificationController = (notifications, act) => ({ list: act((a) => notifications.list(a)) });
