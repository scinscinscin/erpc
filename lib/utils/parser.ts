import express, { NextFunction, Request, Response } from "express";
import formidable from "formidable";
import { ERPCError } from "../error";
import { unflatten } from "flat";

const jsonParser = express.json();
const multipartParser = formidable({ multiples: true });

/**
 * Custom body-parser that either sends the request to express.json() or formidable
 * depending on the content-type header.
 */
export function bodyParser(req: Request, res: Response, next: NextFunction) {
  if (!req.headers["content-type"]?.startsWith("multipart")) return jsonParser(req, res, next);

  return multipartParser.parse(req, (err, fields, files) => {
    if (!err) {
      try {
        const combined = { ...fields, ...files };

        if ("__erpc_body" in combined && typeof combined["__erpc_body"] === "string") {
          const items = JSON.parse(combined["__erpc_body"]);
          delete combined["__erpc_body"];
          for (const [dotKey, value] of items) combined[dotKey] = value;
        }

        req.body = unflatten(combined, { object: false, delimiter: ".", overwrite: false });
        return next();
      } catch (err) {}
    }

    return next(new ERPCError({ code: "BAD_REQUEST", message: "Was not able to process multipart/form-data request" }));
  });
}
