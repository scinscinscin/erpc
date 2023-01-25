import { Router as ExpressRouter, type RouterOptions, type Request, type Response } from "express";
import type { RouteParameters } from "express-serve-static-core";
import { generateProcedure } from "./middleware";
import { Overwrite } from "./utils/types";

export class Router<PathParams extends {}> {
  public readonly expressRouter: ExpressRouter;

  /**
   * @param opts Options for the internal express router. mergeParams is true by default.
   */
  constructor(opts?: RouterOptions) {
    this.expressRouter = ExpressRouter({ mergeParams: true, ...opts });
  }

  public sub<PathString extends string>(path: PathString) {
    const router = new Router<Overwrite<RouteParameters<PathString>, PathParams>>();
    this.expressRouter.use(path, router.expressRouter);
    return router;
  }

  public get<Current extends Record<string, any>, Previous extends {}, EndpointPath extends string, HandlerReturnType>(
    path: EndpointPath,
    mw: ReturnType<typeof generateProcedure<Current, Previous>>
  ) {
    const self = this;

    return function (
      handler: (
        req: Request<Overwrite<RouteParameters<EndpointPath>, PathParams>>,
        res: Response<unknown, Overwrite<Current, Previous>>
      ) => Promise<HandlerReturnType>
    ) {
      self.expressRouter.get(path, mw.use(handler));
    };
  }

  public post<Current extends Record<string, any>, Previous extends {}, EndpointPath extends string, HandlerReturnType>(
    path: EndpointPath,
    mw: ReturnType<typeof generateProcedure<Current, Previous>>
  ) {
    const self = this;

    return function (
      handler: (
        req: Request<Overwrite<RouteParameters<EndpointPath>, PathParams>>,
        res: Response<unknown, Overwrite<Current, Previous>>
      ) => Promise<HandlerReturnType>
    ) {
      self.expressRouter.post(path, mw.use(handler));
    };
  }

  public patch<
    Current extends Record<string, any>,
    Previous extends {},
    EndpointPath extends string,
    HandlerReturnType
  >(path: EndpointPath, mw: ReturnType<typeof generateProcedure<Current, Previous>>) {
    const self = this;

    return function (
      handler: (
        req: Request<Overwrite<RouteParameters<EndpointPath>, PathParams>>,
        res: Response<unknown, Overwrite<Current, Previous>>
      ) => Promise<HandlerReturnType>
    ) {
      self.expressRouter.patch(path, mw.use(handler));
    };
  }

  public put<Current extends Record<string, any>, Previous extends {}, EndpointPath extends string, HandlerReturnType>(
    path: EndpointPath,
    mw: ReturnType<typeof generateProcedure<Current, Previous>>
  ) {
    const self = this;

    return function (
      handler: (
        req: Request<Overwrite<RouteParameters<EndpointPath>, PathParams>>,
        res: Response<unknown, Overwrite<Current, Previous>>
      ) => Promise<HandlerReturnType>
    ) {
      self.expressRouter.put(path, mw.use(handler));
    };
  }

  public delete<
    Current extends Record<string, any>,
    Previous extends {},
    EndpointPath extends string,
    HandlerReturnType
  >(path: EndpointPath, mw: ReturnType<typeof generateProcedure<Current, Previous>>) {
    const self = this;

    return function (
      handler: (
        req: Request<Overwrite<RouteParameters<EndpointPath>, PathParams>>,
        res: Response<unknown, Overwrite<Current, Previous>>
      ) => Promise<HandlerReturnType>
    ) {
      self.expressRouter.delete(path, mw.use(handler));
    };
  }
}
