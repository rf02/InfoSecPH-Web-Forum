const userModel = require('../../../model/schema/users');

const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

async function getUserByUsername(username) {
    try{
        const user = await userModel.findOne({ username });
        return user;
    } catch (error) {
        throw error;
    }
}

function initialize(passport) {
    const authenticateUser = async (username, password, done) => {
        try {
            const user = await getUserByUsername(username);
            if (!user)
                return done(null, false, { message: 'No user with that username' });

            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch)
                return done(null, user);
            else 
                return done(null, false, { message: 'Password Incorrect' });

        } catch (error) {
            return done(error);
        }
    };

    passport.use(new LocalStrategy({ usernameField: 'username' }, authenticateUser));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await userModel.findById(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });

    
}

module.exports = initialize;