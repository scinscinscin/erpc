/* eslint-disable no-underscore-dangle */

import fs, { WriteStream } from "node:fs";
import crypto, { type BinaryLike } from "node:crypto";
import { EventEmitter } from "node:events";

export class FormidableFile extends File {
  filepath: string;
  newFilename: string;
  originalFilename: string;
  mimetype: string;

  constructor(sources: Array<BinaryLike | Blob>, { filepath, newFilename, originalFilename, mimetype, hashAlgorithm }) {
    // @ts-ignore
    super(sources, originalFilename, { type: mimetype, lastModified: Date.now(), endings: "native" });
    this.lastModifiedDate = null;
    this.filepath = filepath;
    this.newFilename = newFilename;
    this.originalFilename = originalFilename;
    this.mimetype = mimetype;
  }

  toJSON() {
    const json = {
      size: this.size,
      filepath: this.filepath,
      newFilename: this.newFilename,
      mimetype: this.mimetype,
      mtime: this.lastModifiedDate,
      length: this.length,
      originalFilename: this.originalFilename,
    };

    if (this.hash && this.hash !== "") {
      json.hash = this.hash;
    }

    return json;
  }

  toString() {
    return `File: ${this.newFilename}, Original: ${this.originalFilename}, Path: ${this.filepath}`;
  }
}

class PersistentFileEmitter extends EventEmitter {
  lastModifiedDate = new Date();
  size = 0;
  _writeStream = null as WriteStream | null;
  filepath: string;
  hash: crypto.Hash | null;
  options: any;
  hashAlgorithm: false | "sha1" | "md5" | "sha256";

  constructor({ filepath, newFilename, originalFilename, mimetype, hashAlgorithm }) {
    super();
    this.filepath = filepath;
    this.options = { filepath, newFilename, originalFilename, mimetype, hashAlgorithm };

    if (typeof this.hashAlgorithm === "string") this.hash = crypto.createHash(this.hashAlgorithm);
    else this.hash = null;
  }

  async getFile() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filepath, (err, buffer) => {
        resolve(new FormidableFile([new Uint8Array(buffer)], this.options));
      });
    });
  }

  open() {
    this._writeStream = fs.createWriteStream(this.filepath);
    this._writeStream.on("error", (err) => {
      this.emit("error", err);
    });
  }

  write(buffer, cb) {
    if (this.hash) {
      this.hash.update(buffer);
    }

    if (this._writeStream!.closed) {
      cb();
      return;
    }

    this._writeStream!.write(buffer, () => {
      this.lastModifiedDate = new Date();
      this.size += buffer.length;
      this.emit("progress", this.size);
      cb();
    });
  }

  end(cb: () => any) {
    if (this.hash) {
      this.hash = this.hash.digest("hex");
    }
    this._writeStream!.end(() => {
      this.emit("end");
      cb();
    });
  }

  destroy() {
    this._writeStream!.destroy();
    const filepath = this.filepath;
    setTimeout(function () {
      fs.unlink(filepath, () => {});
    }, 1);
  }
}

export default PersistentFileEmitter;
