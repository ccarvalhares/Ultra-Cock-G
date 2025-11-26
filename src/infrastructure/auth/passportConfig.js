const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const User = require('../database/schemas/UserSchema');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ discordId: profile.id });
        if (user) {
            return done(null, user);
        }
        user = new User({
            discordId: profile.id,
            username: profile.username,
            avatar: profile.avatar, // Can be null if no avatar set
            discriminator: profile.discriminator || '0000'
        });
        await user.save();
        done(null, user);
    } catch (err) {
        console.error("Passport Strategy Error:", err);
        done(err, null);
    }
}));
