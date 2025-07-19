import { UserDocument } from "../src/schemas/users";

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends UserDocument {}
  }
}
