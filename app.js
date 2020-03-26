// app.js
'use strict'
module.exports = app => {
  app.appData = {
    test: 'test',
  };
  app.once('server', server => {
    // console.log(server);
    // websocket
  });
  app.on('error', (err, ctx) => {
    // report error
    // console.log(err);
    // console.log(ctx);
  });
  app.on('request', ctx => {
    // console.log(ctx);
    // log receive request
  });
  app.on('response', ctx => {
    // ctx.starttime is set by framework
    const used = Date.now() - ctx.starttime;
    // console.log('-----------------used-------------');
    // console.log(used);
    // log total cost
  });
};
