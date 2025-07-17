import "dotenv/config";

/**
 * Instantiate the server (using express)
 */
import app from "./express";

/**
 * Get a reference to the database and connect
 */
import db, { connect } from "./database";
connect();
const internalRouter = { app, db };

/**
 * Get a reference to notifier
 */
import _notifier from "./notifier";
const notifier = _notifier(internalRouter);

/**
 * Passport authentication middleware
 */
import authentication from "./authentication";
authentication(internalRouter);

/**
 * Initialize Routes
 */
const router = { app, db, notifier };
import App from "./routes/app";
App(router);
import Api from "./routes/api";
Api(router);
import Root from "./routes/root";
Root(router);

app.listen(process.env.SERVER_PORT || 4000, () => {
  console.info(`🚀 Server started at http://localhost:${process.env.SERVER_PORT || 4000}/`);
});
