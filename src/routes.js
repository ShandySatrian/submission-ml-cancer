const { addpredictions, getpredictions } = require('./handler');

const routes = [
  {
    method: 'POST',
    path: '/predict',
    options: {
      payload: {
        allow: 'multipart/form-data',
        maxBytes: 1000000,
        parse: true,
        multipart: true,
      },
    },
    handler: addpredictions
  },
  {
    method: 'GET',
    path: '/predict/histories',
    handler: getpredictions
  }
];

module.exports = routes;