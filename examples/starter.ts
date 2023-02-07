import { z } from "zod";
import { generateProcedure, Server } from "../lib";

const server = new Server({
  port: 2000,
  defaultMiddleware: {
    bodyParser: true,
    cookieParser: true,
    corsOptions: { credentials: true, origin: "http://localhost:3000" },
  },
});

const userRouter = server.sub("/user/:user_uuid");
const messagesRouter = userRouter.sub("/message");

const userMap = new Map<string, string>();
userMap.set("testing-token", "scinorandex");

const authMiddleware = generateProcedure(async (req, res) => {
  const user = userMap.get(req.cookies["sessionid"]);
  if (user != undefined) return { username: user };

  res.status(401);
  throw new Error("Unauthorized");
});

messagesRouter.patch(
  "/:message_uuid",
  authMiddleware.input(z.object({ new_content: z.string() })),
  async function (req, res, locals) {
    const { ...testing } = locals;
    //         ^?

    const { ...params } = req.params;
    //         ^?

    return { locals, params };
  }
);
