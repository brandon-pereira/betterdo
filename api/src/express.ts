import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.set("strict routing", true);

/**
 * Express middleware
 */
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: process.env.APP_URL,
      credentials: true,
    }),
  );
}

app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({ extended: true }));

export default app;
