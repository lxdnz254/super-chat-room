const passport  = require('passport');
const bcrypt    = require('bcrypt');

module.exports = (app, db) => {
  
  var ensureAuthenticated = (req, res, next) => {
      console.log('authenticate: ' + req.isAuthenticated())
      if (req.isAuthenticated()) {
          return next();
      }
      console.log("authenticate redirecting");
      res.redirect('/');
    };
  
  app.route('/')
    .get((req, res) => {
      res.render(process.cwd() + '/views/pug/index.pug', {title: 'Home Page',
                                                          message: 'Please login',
                                                          showLogin: false,
                                                          showRegistration: false
                                                         });
    });
  
  app.route('/auth/github')
    .get(passport.authenticate('github'))
  
  app.route('/auth/github/callback')
    .get(passport.authenticate('github',{ failureRedirect: '/'}), (req,res)=>{
      res.redirect('/profile')
  })

  app.route('/login')
    .post(passport.authenticate('local', { failureRedirect: '/' }),(req,res) => {
         res.redirect('/profile');
    });

  app.route('/profile')
    .get(ensureAuthenticated, (req,res) => {
         res.render(process.cwd() + '/views/pug/profile.pug', {user: req.user});
    });

  app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
    });

  app.route('/register')
    .post((req, res, next) => {
        db.collection('users').findOne({ username: req.body.username }, function (err, user) {
            if(err) {
                next(err);
            } else if (user) {
                res.redirect('/');
            } else {
                // hash variable
                let hash = bcrypt.hashSync(req.body.password, 12);
                db.collection('users').insertOne(
                  {username: req.body.username,
                   password: hash},
                  (err, doc) => {
                      if(err) {
                          res.redirect('/');
                      } else {
                          next(user);
                      }
                  }
                )
            }
        })},
      passport.authenticate('local', { failureRedirect: '/' }),
      (req, res, next) => {
          res.redirect('/profile');
      }
  );

  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not found')
  });
  
  // Enable to pass the challenge called "Advanced Node and Express - 
  // Registration of New Users"
  if (process.env.ENABLE_DELAYS) app.use((req, res, next) => {
    switch (req.method) {
      case 'GET':
        switch (req.url) {
          case '/logout': return setTimeout(() => next(), 500);
          case '/profile': return setTimeout(() => next(), 700);
          default: next();
        }
      break;
      case 'POST':
        switch (req.url) {
          case '/login': return setTimeout(() => next(), 900);
          default: next();
        }
      break;
      default: next();
    }
  });
}