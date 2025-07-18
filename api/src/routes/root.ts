import express, { Application } from "express";
import url from "url";

export default ({ app }: { app: Application }): void => {
  app.use("/", (req, res, next) => {
    if (req.path === "/" && req.user) {
      res.redirect(url.resolve(process.env.SERVER_URL || "", "app"));
    } else {
      next();
    }
  });

  app.use("/", express.static(process.env.LANDING_FOLDER ?? "../website/dist/"));
};
