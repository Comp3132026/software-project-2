const { Notification } = require('../models/Notification');

const sendNotification = async ({ user, group, type, message }) => {
  try {
    if (!user || !type || !message) return null;

    return await Notification.create({
      user,
      group,
      type,
      message,
    });
  } catch (error) {
    console.error('Notification error:', error.message);
    return null;
  }
};

const notifyGroup = async ({ group, members, type, message }) => {
  try {
    if (!group || !members || !type || !message) return;

    const notifications = members.map((m) => ({
      user: m.user,
      group,
      type,
      message,
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Group notification error:', error.message);
  }
};

module.exports = { sendNotification, notifyGroup };