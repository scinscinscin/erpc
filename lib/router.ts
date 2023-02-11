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
  merge: <SubPathParams extends {}>(subrouter: RouterT<SubPathParams>) => RouterT<PathParams>;
  subroutedAt: () => string;
  get: HTTPMethodProviderType<PathParams>;
  post: HTTPMethodProviderType<PathParams>;
  put: HTTPMethodProviderType<PathParams>;
  patch: HTTPMethodProviderType<PathParams>;
  delete: HTTPMethodProviderType<PathParams>;
}

export function Router<PathParams extends {}>(path: string, opts?: RouterOptions): RouterT<PathParams> {
  const expressRouter = ExpressRouter({ mergeParams: true, ...opts });

  return {
    expressRouter,
    subroutedAt: () => path,
    sub: function <PathString extends string>(path: PathString) {
      const router = Router<Overwrite<RouteParameters<PathString>, PathParams>>(path);
      this.expressRouter.use(path, router.expressRouter);
      return router;
    },

    merge: function (subrouter) {
      this.expressRouter.use(subrouter.subroutedAt(), subrouter.expressRouter);
      return this;
    },

    get: (path, mw, handler) => expressRouter.get(path, mw.__finalize(handler)),
    post: (path, mw, handler) => expressRouter.post(path, mw.__finalize(handler)),
    put: (path, mw, handler) => expressRouter.put(path, mw.__finalize(handler)),
    patch: (path, mw, handler) => expressRouter.patch(path, mw.__finalize(handler)),
    delete: (path, mw, handler) => expressRouter.delete(path, mw.__finalize(handler)),
  };
}
