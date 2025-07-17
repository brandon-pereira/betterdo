import { Application, Request, Response } from "express";
import { Database } from "../database";
import { UserDocument } from "../schemas/users";
import { Notifier } from "../notifier";
import { throwError, handleUncaughtError } from "./errorHandler";

export interface InternalRouter {
  app: Application;
  db: Database;
}

export interface RouterOptions {
  db: Database;
  notifier: Notifier;
  user: UserDocument;
}

interface RouteHandlerOptions {
  res: Response;
  req: Request;
  db: Database;
  notifier: Notifier;
}

export default async function (
  taskName = "performing task",
  { res, req, db, notifier }: RouteHandlerOptions,
  taskFn: (cb: RouterOptions) => Promise<unknown>
): Promise<void> {
  try {
    const user = req.user;
    if (!user || req.isUnauthenticated()) {
      throwError("User is not authorized to make this call.");
    }
    const json = await taskFn({
      notifier,
      db,
      user: req.user! // we know its authenticated at this point
    });
    // We assume that if the taskFn function resolves, then we have a valid 200 response
    res.json(json);
  } catch (err: unknown) {
    handleUncaughtError(taskName, res, err);
  }
}
