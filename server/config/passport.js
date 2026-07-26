const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/User");

passport.use(
    new GoogleStrategy(
        {
            clientID: (process.env.GOOGLE_CLIENT_ID || "").trim(),
            clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
            // Trim — Render/UI pastes often add a trailing newline (%0A), which Google rejects
            callbackURL: (process.env.GOOGLE_CALLBACK_URL || "").trim(),
        },

        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value.toLowerCase();

                if (!email.endsWith("@smail.iitm.ac.in")) {
                    return done(null, false, {
                        message: "Only IIT Madras SMAIL accounts are allowed.",
                    });
                }


                

                const user = await User.findOne({
                    email,
                    status: true,
                });

                if (!user) {
                    return done(null, false, {
                        message: "User is not registered.",
                    });
                }

                user.googleId = profile.id;
                user.lastLogin = new Date();

                if (profile.photos && profile.photos.length > 0) {
                    user.profilePhoto = profile.photos[0].value;
                }

                await user.save();

                return done(null, user);

            } catch (err) {

                return done(err, null);

            }
        }
    )
);

module.exports = passport;