import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getWrapped, parseWrappedPeriod } from "../services/wrapped.js";

const wrappedApi = new Hono();

// `:period` is a month ("2026-10"), a calendar year ("2026") or the literal "all-time".
wrappedApi.get("/:period", authMiddleware, async c => {
  const user = c.get("user");
  const period = parseWrappedPeriod(c.req.param("period"));
  if (!period) {
    return c.json({ error: "Invalid period" }, 400);
  }

  const result = await getWrapped({
    userId: user.id,
    period,
    timeZone: user.timeZone
  });

  return c.json(result);
});

export default wrappedApi;
