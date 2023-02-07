import { NextFunction, Request, Response, Router } from "express";
import { z, ZodType } from "zod";
import { Overwrite } from "./utils/types";

type Middleware<Ret, ExistingParams extends Record<string, any>> = (
  req: Request,
  res: Response<unknown, ExistingParams>
) => Promise<Ret>;

export type GenerateProcedure<Current extends Record<string, any>, Previous extends {}> = {
  extend: <ExtensionType extends Record<string, any>>(
    append: Middleware<ExtensionType, Overwrite<Current, Previous>>
  ) => GenerateProcedure<ExtensionType, Overwrite<Current, Previous>>;
  input: <T extends ZodType<any, any, any>>(
    checker: T
  ) => GenerateProcedure<{ input: z.infer<T> }, Overwrite<Current, Previous>>;
  use: <HandlerReturnType, RouteParams = {}>(
    handler: (
      req: Request<RouteParams>,
      res: Response<unknown, Overwrite<Current, Previous>>,
      locals: Overwrite<Current, Previous>
    ) => Promise<HandlerReturnType>
  ) => Router;
};

export function generateProcedure<
  Current extends Record<string, any> /** The type of the object returned by the current middleware */,
  Previous extends {} /** The sum of the object returned by the previous middleware */
>(
  mw: Middleware<Current, Previous>,
  ctx?: { previous?: Middleware<unknown, any>[] }
): GenerateProcedure<Current, Previous> {
  const previous = ctx?.previous ?? ([] as Middleware<unknown, any>[]);
  previous.push(mw);

  type MergedLocals = Overwrite<Current, Previous>;

  /**
   * Attach another middleware to the current procedure, the properties that the middleware returns is added into the locals object of the response
   */
  function extend<ExtensionType extends Record<string, any>>(append: Middleware<ExtensionType, MergedLocals>) {
    // The middleware that is going to be appended needs to know the sum of the middleware that came before it, so we give it MergedLocals
    // We also need to keep track of the properties it's going to append, which is passed into generateProcedure
    return generateProcedure<ExtensionType, MergedLocals>(append, { previous });
  }

  return {
    extend,

    input: function <T extends ZodType<any, any, any>>(checker: T) {
      const bodyValidator: Middleware<{ input: z.infer<T> }, MergedLocals> = async function (req, res) {
        const body = await checker.parseAsync(req.body);
        return { input: body };
      };

      return extend(bodyValidator);
    },

    use: function <HandlerReturnType, RouteParams = {}>(
      handler: (
        req: Request<RouteParams>,
        res: Response<unknown, MergedLocals>,
        locals: MergedLocals
      ) => Promise<HandlerReturnType>
    ) {
      const middlewares: any[] = previous.map((mwFunction) => {
        return function (req: Request, res: Response, next: NextFunction) {
          mwFunction(req, res as any)
            .then((result) => {
              Object.entries(result as Record<string, any>).forEach(([key, value]) => {
                res.locals[key] = value;
              });

              return next();
            })
            .catch(next); /** Send the error to the root level error handler */
        };
      });

      middlewares.push(function (req: Request<RouteParams>, res: Response, next: NextFunction) {
        handler(req, res as Response<unknown, MergedLocals>, res.locals as MergedLocals)
          .then((result) => {
            res.json({ success: true, result });
          })
          .catch(next);
      });

      return Router({ mergeParams: true }).use("/", ...middlewares);
    },
  };
}
