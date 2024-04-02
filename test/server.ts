import { z } from "zod";
import { baseProcedure, Server, ERPCError, zodFile } from "../lib";

export const testServer = new Server({
  port: 2000,
  defaultMiddleware: {
    bodyParser: true,
    cookieParser: true,
    corsOptions: { credentials: true, origin: "http://localhost:2000" },
  },
});

const router = testServer.rootRouter;

router.post(
  "/login",
  baseProcedure.input(z.object({ username: z.string(), password: z.string() })),
  async (req, res, { input }) => {
    if (input.username === input.password) {
      res.cookie("auth-cookie", input.username);
      return { loggedIn: true };
    }

    return { loggedIn: false };
  }
);

const userRouter = router.sub("/users");
userRouter.get("/", baseProcedure, async (req, res) => {
  return { users: [{ username: "scinorandex" }, { username: "proksy" }] };
});

userRouter.put(
  "/:user_uuid",
  baseProcedure.input(z.object({ new_password: z.string() })),
  async (req, res, { input }) => {
    return { updatedUser: { uuid: req.params.user_uuid } };
  }
);
