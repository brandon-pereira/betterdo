import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getWrapped } from "../services/wrapped.js";
import { wrappedPeriodSchema } from "../validators/wrapped.js";
import { validationErrorHook } from "../utils/validationErrorHook.js";

const wrappedApi = new Hono();

// HTTP QUERY (RFC 10008): a read-only request that carries the period as a JSON body.
wrappedApi.query("/", authMiddleware, zValidator("json", wrappedPeriodSchema, validationErrorHook), async c => {
  const user = c.get("user");
  const result = await getWrapped({
    userId: user.id,
    period: c.req.valid("json"),
    timeZone: user.timeZone
  });
  return c.json(result);
});

export default wrappedApi;
