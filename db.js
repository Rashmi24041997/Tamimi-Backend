const config = require('../config/config');  
// var base_url = 'http://localhost:5000/v1/';
const mongoose = require('mongoose');
mongoose.connect(config.mongoose.url, {
    "auth": { "authSource": "admin" },
    "user": "nwtest",
    "pass": "#net@worktestSuite",
    "useCreateIndex": true,
    "useNewUrlParser": true,
    "useUnifiedTopology": true,
  }).then(() => {
    // logger.info('Connected to MongoDB');
    // server = app.listen(config.port, () => {
    //   // logger.info(`Listening to port ${config.port} ${config.mongoose.url}`);
    // })
  });

  module.exports = {
    showLogs:function(data){
      // console.log(data);
    }
  }