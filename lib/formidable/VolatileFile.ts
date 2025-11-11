/* eslint-disable no-underscore-dangle */

import { EventEmitter } from 'node:events';

class VolatileFileWrapper extends EventEmitter {
  constructor({ filepath, newFilename, originalFilename, mimetype, hashAlgorithm, createFileWriteStream }) {
    super();

    this.createFileWriteStream = createFileWriteStream;
    this.file = new FormidableFile({ filepath, newFilename, originalFilename, mimetype, hashAlgorithm });
    this._writeStream = null;

    if (typeof this.hashAlgorithm === 'string') this.hash = crypto.createHash(this.hashAlgorithm);
    else this.hash = null;
  }

  open() {
    this._writeStream = this.createFileWriteStream(this);
    this._writeStream.on('error', (err) => {
      this.emit('error', err);
    });
  }

  destroy() {
    this._writeStream.destroy();
  }

  write(buffer, cb) {
    if (this.hash) {
      this.hash.update(buffer);
    }

    if (this._writeStream.closed || this._writeStream.destroyed) {
      cb();
      return;
    }

    this._writeStream.write(buffer, () => {
      this.file.size += buffer.length;
      this.emit('progress', this.size);
      cb();
    });
  }

  end(cb) {
    if (this.hash) {
      this.hash = this.hash.digest('hex');
    }
    this._writeStream.end(() => {
      this.emit('end');
      cb();
    });
  }
}

export default VolatileFileWrapper;
