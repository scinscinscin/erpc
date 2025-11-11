import { FormidableFile } from "../formidable";
import { z } from "zod";

export type FileWrapper<T> = File & { "{FileWrapperType}": T };

export function zodFile<T extends string>(filetype: T | T[]) {
  return z
    .custom<FileWrapper<T>>((v) => {
      try {
        if (!(v instanceof File)) return false;

        const mime = (v as unknown as FormidableFile).type;
        if (typeof filetype === "string" && filetype !== mime) return false;
        else if (typeof filetype === "object" && !filetype.includes(mime as T)) return false;
      } catch (err) {
        return false;
      }

      return true;
    })
    .transform((val, ctx) => {
      /** Transform the multipart data from the client to something the server can work with */
      return val as unknown as FormidableFile;
    });
}
