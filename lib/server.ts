import express, { Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import { Router, RouterT } from "./router";

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
  };
}

export class Server {
  private constructorOptions: ServerConstructorOptions;
  private readonly LOG_ERRORS: boolean;
  private readonly app = express();
  public readonly rootRouter: RouterT<{}>;

  constructor(opts: ServerConstructorOptions, router = Router("/")) {
    this.rootRouter = router;
    this.constructorOptions = opts;
    this.LOG_ERRORS = !(opts.logErrors === false);

    const { defaultHeaders, defaultMiddleware } = this.constructorOptions;
    if (!(defaultHeaders?.etag === true)) this.app.disable("etag");
    if (!(defaultHeaders?.xPoweredBy === true)) this.app.disable("x-powered-by");

    if (defaultMiddleware?.corsOptions !== undefined) this.app.use(cors(defaultMiddleware.corsOptions));
    if (!(defaultMiddleware?.bodyParser === false)) this.app.use(express.json());
    if (!(defaultMiddleware?.cookieParser === false)) this.app.use(cookieParser());

    this.app.use("/", this.rootRouter.expressRouter);

    /** Error handler */
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      if (this.constructorOptions.errorHandler != undefined) {
        return this.constructorOptions.errorHandler(err, req, res);
      }

      if (err !== undefined && this.LOG_ERRORS) console.error(err);
      if (res.statusCode === 200) res.status(500);
      res.json({ success: false, err: this.LOG_ERRORS ? err.message : undefined });
    });

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
