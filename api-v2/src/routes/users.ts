import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getUserByEmail } from "../services/users.js";

const usersApi = new Hono();

usersApi.get("/:email", authMiddleware, async c => {
  const email = c.req.param("email");
  const result = await getUserByEmail(email);

  if (!result) {
    return c.json({ error: "Invalid User Email" }, 404);
  }

  return c.json(result);
});

export default usersApi;
