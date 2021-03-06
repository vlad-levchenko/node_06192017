'use strict';

require('colors');

const http = require('http');
const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const cors = require('cors');

// const cluster = require('cluster');
// const numCPUs = require('os').cpus().length;

const config = require('./config.json');

require('./start-up')(config).then(() => {

  // if (cluster.isMaster) {

  //   console.log(`Master ${process.pid} is running`);

  //   // Fork workers.
  //   for (let i = 0; i < numCPUs; i++) {
  //     cluster.fork();
  //   }

  //   cluster.on('exit', (worker, code, signal) => {
  //     console.log(`worker ${worker.process.pid} died`);
  //   });

  // } else {

  const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeader(),
    secretOrKey: 'secret',
    algorithms: ['HS256']
  };

  passport.use(new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    done(null, { name: jwtPayload.name });
  }));

  const WidgetsData = require('./widgets-data');
  const widgetsData = new WidgetsData(config.dbFileName);
  const widgetRouter = require('./rest-router')(widgetsData);

  const app = express();
  const server = http.createServer(app);

  app.use(cors());
  app.use(passport.authenticate('jwt', { session: false }));
  app.use(config.endPoint, bodyParser.json());
  app.use(`${config.endPoint}/widgets`, widgetRouter);

  server.listen(config.port, () => {
    console.log(`rest service worker ${process.pid} running on port ${config.port}`.blue);
  });

  process.on('exit', () => console.log(`rest service worker ${process.pid} exiting`.magenta));
  process.on('SIGINT', () => process.exit());
//  }

});
