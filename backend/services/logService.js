const { HistoryLog } = require('../models/Notification');

const logGroupAction = async ({ group, action, performedBy, details = '' }) => {
  try {
    if (!group || !action || !performedBy) {
      return null;
    }

    return await HistoryLog.create({
      group,
      action,
      performedBy,
      details,
    });
  } catch (error) {
    console.error('Error creating history log:', error.message);
    return null;
  }
};

module.exports = { logGroupAction };