'use strict';

const express     = require('express');
const app = express();
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const session     = require('express-session');
const passport    = require('passport');
const mongo       = require('mongodb').MongoClient;
const routes      = require('./routes.js');
const auth        = require('./auth.js');
const http        = require('http').Server(app);
const cookieParser = require('cookie-parser');
const sessionStore = new session.MemoryStore();
const io          = require('socket.io')(http);
const passportSocketIo = require('passport.socketio');

app.set('view engine', 'pug')

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
// set up passport & session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  key: 'express.sid',
  store: sessionStore
}));
app.use(passport.initialize());
app.use(passport.session());


//connect mongoDB then inside serialization and listen --> proper way to connect
mongo.connect(process.env.DATABASE, {useNewUrlParser: true},(err, client) => {
    if(err) {
        console.log('Database error: ' + err);
    } else {
        console.log('Successful database connection');
        const db = client.db('test')
        
        auth(app, db);
        routes(app, db);
      
        http.listen(process.env.PORT || 3000, () => {
          console.log("Listening on port " + process.env.PORT);
        });
        
      
        /* Socket.io stuff here */
        io.use(passportSocketIo.authorize({
          cookieParser: cookieParser,
          key:          'express.sid',
          secret:       process.env.SESSION_SECRET,
          store:        sessionStore
        }));
        var currentUsers = 0;
        io.on('connection', socket => {
          console.log('user ' + socket.request.user.name + ' has connected');
          currentUsers++;
          io.emit('user', {name: socket.request.user.name, currentUsers, connected: true});
          socket.on('disconnect', () => {
            console.log('user ' + socket.request.user.name + ' disconnected');
            currentUsers--;
            io.emit('user', {name: socket.request.user.name, currentUsers, connected: false});
          });
          socket.on('chat message', (msg) => {
          
            io.emit('chat message', {name: socket.request.user.name, message: msg})
          });
        });
        
      
}});



