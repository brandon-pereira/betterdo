import session from "./session";
import passport from "./passport";
import web from "./web";
import logout from "./logout";
import { InternalRouter } from "../helpers/routeHandler";

export default ({ app, db }: InternalRouter): void => {
  session({ app, db });
  passport({ app, db });
  logout({ app, db });
  web({ app, db });
};
