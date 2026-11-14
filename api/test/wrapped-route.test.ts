import { describe, test, expect, vi, beforeAll } from "vitest";
import createRouter, { type RouterOptions } from "./helpers/createRouter.js";

let router: RouterOptions;

// Skips the real session lookup and signs in as the test user.
vi.mock("../src/middlewares/authMiddleware.js", async () => {
  const { createMiddleware } = await import("hono/factory");
  return {
    authMiddleware: createMiddleware(async (c, next) => {
      c.set("user", router.user);
      return next();
    })
  };
});

const { default: wrappedApi } = await import("../src/routes/wrapped.js");

const query = (body: unknown, method = "QUERY") =>
  wrappedApi.request("/", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("Wrapped route", () => {
  beforeAll(async () => {
    router = await createRouter();
  });

  test("Answers QUERY requests with the requested period", async () => {
    const month = await query({ year: 2025, month: 6 });
    expect(month.status).toBe(200);
    expect(await month.json()).toMatchObject({ periodType: "month", year: 2025, month: 6 });

    const allTime = await query({ all: true });
    expect(await allTime.json()).toMatchObject({ periodType: "all-time" });
  });

  test("Rejects an invalid period", async () => {
    expect((await query({ year: 2025, month: 13 })).status).toBe(400);
    expect((await query({ all: "true" })).status).toBe(400);
  });

  test("Only accepts the QUERY method", async () => {
    expect((await query({ all: true }, "POST")).status).toBe(404);
  });
});
