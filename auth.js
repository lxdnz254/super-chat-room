const passport  = require('passport');
const bcrypt    = require('bcrypt');
const ObjectID  = require('mongodb').ObjectID;
const LocalStrategy  = require('passport-local');
const GitHubStrategy = require('passport-github');

module.exports = (app, db) => {

  //serialization and app.listen
        // de/serialize user for passport
        passport.serializeUser((user, done) => {
          done(null, user._id)
        })

        passport.deserializeUser((id, done) => {
            db.collection('socialusers').findOne(
                    {_id: new ObjectID(id)},
                    (err, doc) => {
                        done(null, doc);
                    }
                ); 
        })
  
        /* local strategy
        passport.use(new LocalStrategy(
          function(username, password, done) {
            db.collection('users').findOne({ username: username }, function (err, user) {
              console.log('User '+ username +' attempted to log in.');
              if (err) { return done(err); }
              if (!user) { return done(null, false); }
              if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
              return done(null, user);
            });
          }
        ));
        */
  
        // github strategy
        passport.use(new GitHubStrategy({
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: 'https://jolly-platinum.glitch.me/auth/github/callback'/*INSERT CALLBACK URL ENTERED INTO GITHUB HERE*/
        }, (accessToken, refreshToken, profile, cb) => {
            //console.log(profile);
            //Database logic here with callback containing our user object
                db.collection('socialusers').findAndModify(
                  {id: profile.id},
                  {},
                  {$setOnInsert:{
                      id: profile.id,
                      name: profile.displayName || 'John Doe',
                      photo: profile.photos[0].value || '',
                      email: profile._json.email || 'No public email',
                      created_on: new Date(),
                      provider: profile.provider || ''
                  },$set:{
                      last_login: new Date()
                  },$inc:{
                      login_count: 1
                  }},
                  {upsert:true, new: true},
                  (err, doc) => {
                    console.log("doc: " + doc.value)
                      return cb(err, doc.value);
                  }
              );
        }
      ));
        
}