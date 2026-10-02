const app = require('../../backend/src/index.js');

module.exports = (req, res) => {
  return app(req, res);
};
