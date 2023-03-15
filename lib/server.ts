import express, { Request, Response, NextFunction, Router as ExpressRouter } from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import { Router, RouterT } from "./router";
import morgan from "morgan";
import { ERPCError, ErrorMap } from "./error";
import { bodyParser } from "./utils/parser";

export interface ServerConstructorOptions {
  /** The port to run the server on */
  port: number;

  /** Whether the server logs to the response object and console when using the default error handler */
  logErrors?: boolean;

  /** Whether the server should automatically start. Defaults to true */
  startAuto?: boolean;

  errorHandler?: (error: Error, req: Request, res: Response) => void;

  defaultHeaders?: {
    /** If true, the server sets the etag header. Defaults to false */
    etag?: boolean;

    /** If true, the server sets the x-powered-by header. Defaults to false */
    xPoweredBy?: boolean;
  };

  defaultMiddleware?: {
    /**
     * If defined, the server loads cors middleware with these options.
     * Defaults to undefined.
     * @see https://expressjs.com/en/resources/middleware/cors.html
     */
    corsOptions?: CorsOptions;

    /** If true, the server loads body-parser. Defaults to true */
    bodyParser?: boolean;

    /** If true, the server loads cookie-parser. Defaults to true */
    cookieParser?: boolean;

    /** If true, the server loads morgan. Defaults to true */
    morgan?: boolean;
  };
}

export class Server {
  private constructorOptions: ServerConstructorOptions;
  private readonly LOG_ERRORS: boolean;
  private readonly app = express();
  public readonly rootRouter: RouterT<{}>;

  /**
   * Intermediate encapsulates all the working logic of erpc, so it can be attatched to
   * other Express servers (like serving ERPC on /api while a Next.js server runs on /).
   * Example:
   *
   * ```ts
   * server.use("/api", erpc.intermediate);
   * server.get("*", (req, res) => {
   *  return handle(req, res);
   * });
   * ```
   */
  public readonly intermediate: ExpressRouter;

  constructor(opts: ServerConstructorOptions, router = Router("/")) {
    this.rootRouter = router;
    this.intermediate = ExpressRouter();
    this.constructorOptions = opts;
    this.LOG_ERRORS = !(opts.logErrors === false);

    const { defaultHeaders, defaultMiddleware } = this.constructorOptions;
    if (!(defaultHeaders?.etag === true)) this.app.disable("etag");
    if (!(defaultHeaders?.xPoweredBy === true)) this.app.disable("x-powered-by");

    if (defaultMiddleware?.corsOptions !== undefined) this.intermediate.use(cors(defaultMiddleware.corsOptions));
    if (!(defaultMiddleware?.bodyParser === false)) this.intermediate.use(bodyParser);
    if (!(defaultMiddleware?.cookieParser === false)) this.intermediate.use(cookieParser());
    if (!(defaultMiddleware?.morgan === false)) this.intermediate.use(morgan("common"));

    this.intermediate.use(this.rootRouter.expressRouter);

    /** Error handler */
    this.intermediate.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      if (this.constructorOptions.errorHandler != undefined) {
        return this.constructorOptions.errorHandler(err, req, res);
      }

      if (err !== undefined && this.LOG_ERRORS) console.error(err);
      if (err instanceof ERPCError) {
        const {
          opts: { message, code: type, customHTTPCode },
        } = err;

        res.status(customHTTPCode ?? ErrorMap[type]);
        res.json({ success: false, error: { type, message } });

        return;
      }

      if (res.statusCode === 200) res.status(500);
      if (err instanceof Error) res.json({ success: false, error: this.LOG_ERRORS ? err.message : undefined });
      else res.json({ success: false, error: "Unknown internal server error" });
    });

    this.app.use("/", this.intermediate);

    if (!(opts?.startAuto === false)) {
      this.listen((port) => {
        console.log("Server has started on port", port);
      });
    }
  }

  sub<PathString extends string>(path: PathString) {
    return this.rootRouter.sub(path);
  }

  listen(handler: (port: number) => void) {
    this.app.listen(this.constructorOptions.port, () => {
      handler(this.constructorOptions.port);
    });
  }
}
