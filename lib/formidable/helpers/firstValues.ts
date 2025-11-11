import { multipartType } from "../plugins/multipart";
import { querystringType } from "../plugins/querystring";
import { FormidableFile } from "../PersistentFile";
import { Files, Fields } from "../Formidable";

const firstValues = (form: Files, fields: Fields, exceptions = [] as string[]) => {
  if (form.type !== querystringType && form.type !== multipartType) {
    return fields;
  }

  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => {
      if (exceptions.includes(key)) return [key, value];
      return [key, value[0]];
    })
  );
};

export { firstValues };
