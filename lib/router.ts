import { Router as ExpressRouter, type RouterOptions, type Request, type Response } from "express";
import type { RouteParameters } from "express-serve-static-core";
import { generateProcedure } from "./middleware";
import { Overwrite } from "./utils/types";

type HTTPMethodProviderType<PathParams extends {}> = <
  Current extends Record<string, any>,
  Previous extends {},
  EndpointPath extends string,
  HandlerReturnType
>(
  path: EndpointPath,
  mw: ReturnType<typeof generateProcedure<Current, Previous>>,
  handler: (
    req: Request<Overwrite<RouteParameters<EndpointPath>, PathParams>>,
    res: Response<unknown, Overwrite<Current, Previous>>,
    locals: Overwrite<Current, Previous>
  ) => Promise<HandlerReturnType>
) => void;

export interface RouterT<PathParams extends {}> {
  expressRouter: ExpressRouter;
  sub: <PathString extends string>(path: PathString) => RouterT<Overwrite<RouteParameters<PathString>, PathParams>>;

  get: HTTPMethodProviderType<PathParams>;
  post: HTTPMethodProviderType<PathParams>;
  put: HTTPMethodProviderType<PathParams>;
  patch: HTTPMethodProviderType<PathParams>;
  delete: HTTPMethodProviderType<PathParams>;
}

export function Router<PathParams extends {}>(opts?: RouterOptions): RouterT<PathParams> {
  const expressRouter = ExpressRouter({ mergeParams: true, ...opts });

  return {
    expressRouter,
    sub: function <PathString extends string>(path: PathString) {
      const router = Router<Overwrite<RouteParameters<PathString>, PathParams>>();
      this.expressRouter.use(path, router.expressRouter);
      return router;
    },

    get: (path, mw, handler) => expressRouter.get(path, mw.use(handler)),
    post: (path, mw, handler) => expressRouter.post(path, mw.use(handler)),
    put: (path, mw, handler) => expressRouter.put(path, mw.use(handler)),
    patch: (path, mw, handler) => expressRouter.patch(path, mw.use(handler)),
    delete: (path, mw, handler) => expressRouter.delete(path, mw.use(handler)),
  };
}
