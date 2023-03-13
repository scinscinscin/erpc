import { Router as ExpressRouter, type RouterOptions, type Request, type Response } from "express";
import type { RouteParameters } from "express-serve-static-core";
import { generateProcedure } from "./middleware";
import { Overwrite } from "./utils/types";

function log(s: string) {
  if (process.env.ERPC_LOG !== undefined) console.log("ERPC: " + s);
}

function logBypass<T>(s: string, cb: () => T) {
  log(s);
  return cb();
}

type HTTPMethodProviderType<PathParams extends {}> = <
  Current extends Record<string, any>,
  Previous extends {},
  InputContext extends Record<string, any>,
  EndpointPath extends string,
  HandlerReturnType
>(
  path: EndpointPath,
  mw: ReturnType<typeof generateProcedure<Current, Previous, InputContext>>,
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
    sub: function <PathString extends string>(subRouterPath: PathString) {
      const router = Router<Overwrite<RouteParameters<PathString>, PathParams>>(subRouterPath);
      log("forking subrouter " + router.subroutedAt() + " from " + path);
      this.expressRouter.use(subRouterPath, router.expressRouter);
      return router;
    },

    merge: function (subrouter) {
      log("merging subrouter " + subrouter.subroutedAt() + " to " + path);
      this.expressRouter.use(subrouter.subroutedAt(), subrouter.expressRouter);
      return this;
    },

    get: (p, mw, handler) =>
      logBypass(`Attatching get handler ${p} to ${path}`, () => expressRouter.get(p, mw.__finalize(handler))),
    post: (p, mw, handler) =>
      logBypass(`Attatching post handler ${p} to ${path}`, () => expressRouter.post(p, mw.__finalize(handler))),
    put: (p, mw, handler) =>
      logBypass(`Attatching put handler ${p} to ${path}`, () => expressRouter.put(p, mw.__finalize(handler))),
    patch: (p, mw, handler) =>
      logBypass(`Attatching patch handler ${p} to ${path}`, () => expressRouter.patch(p, mw.__finalize(handler))),
    delete: (p, mw, handler) =>
      logBypass(`Attatching delete handler ${p} to ${path}`, () => expressRouter.delete(p, mw.__finalize(handler))),
  };
}
