import passport from "passport";
import { Strategy, Profile } from "passport-google-oauth20";
import url from "url";
import { InternalRouter } from "../helpers/routeHandler";

interface GoogleUser {
  google_id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string;
}

export default ({ app, db }: InternalRouter): void => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientID || !clientSecret) {
    throw new Error("Missing Google Auth Environment Variables.");
  }
  passport.use(
    new Strategy(
      {
        clientID,
        clientSecret,
        callbackURL: url.resolve(process.env.SERVER_URL || "", "auth/google/callback")
      },
      async (_accessToken: string, _refreshToken: string, profile: Profile, cb) => {
        if (!profile) {
          cb("AuthError");
        }
        const googleId = profile.id;

        const googleInfo = {
          google_id: googleId,
          firstName: profile?.name?.givenName,
          lastName: profile?.name?.familyName,
          email: profile && profile.emails && profile.emails[0] ? profile.emails[0].value : "N/A",
          profilePicture: profile && profile.photos && profile.photos[0] ? profile.photos[0].value : "N/A"
        } as GoogleUser;
        let user = await db.Users.findOne({
          google_id: googleId
        });
        if (!user) {
          console.log("New User Sign-up", googleInfo);
          // Create User
          user = await db.Users.create(googleInfo);
          const inbox = new db.Lists({
            title: "Inbox",
            type: "inbox",
            owner: user._id
          });
          await inbox.save();
          return cb(null, user);
        } else {
          // Existing user
          const hasGoogleAccountUpdated = (Object.keys(googleInfo) as Array<keyof typeof googleInfo>).find(key => {
            if (googleInfo[key] && user) {
              googleInfo[key] !== user[key];
            }
            return false;
          });
          if (hasGoogleAccountUpdated) {
            console.log("user info updated", hasGoogleAccountUpdated);
            user.set(googleInfo);
            await user.save();
          }
          // Now ensure all lists are valid
          const userListCount = user.lists.length;
          await user.populate("lists");
          if (user.lists.length !== userListCount) {
            user.lists = user.lists.map(list => list.id);
            await user.save();
          }
          return cb(null, user);
        }
      }
    )
  );

  app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  app.get("/auth/google/callback", passport.authenticate("google"), (req, res) => {
    res.redirect(url.resolve(process.env.APP_URL || "", process.env.NODE_ENV === "production" ? "/app" : ""));
  });
};
