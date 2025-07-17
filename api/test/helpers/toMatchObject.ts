/* eslint-disable @typescript-eslint/no-namespace */

// https://stackoverflow.com/a/43674912/7033335
import { ObjectId } from "mongoose";

export {};

declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchId(expected: ObjectId): R;
      toContainId(expected: ObjectId): R;
    }
  }
}

expect.extend({
  toMatchId(source: ObjectId, received: ObjectId) {
    const pass = received.toString() === source.toString();
    return {
      message: () => `expected "${received}" to match "${source}"`,
      pass
    };
  },
  toContainId(source: [ObjectId], received: ObjectId) {
    const stringifiedSource = source.map(source => source.toString());
    const pass = stringifiedSource.includes(received.toString());
    return {
      message: () => `expected "${received}" to be included in array "${stringifiedSource}"`,
      pass
    };
  }
});
