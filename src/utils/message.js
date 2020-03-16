const createMessage = (username, content) => {
  return {
    username,
    content,
    sentAt: new Date().getTime()
  };
};

const createLocationMessage = (username, url) => {
  return {
    username,
    url,
    sentAt: new Date().getTime()
  };
};

module.exports = {
  createMessage,
  createLocationMessage
};
