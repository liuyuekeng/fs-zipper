"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const packer = require("zip-stream");
const nodePath = require("path");
function matcher(fs, path, callback) {
    let stats = fs.statSync(path);
    if (stats.isDirectory(fs)) {
        callback(path, stats);
        let files = fs.readdirSync(path);
        files.forEach(file => {
            matcher(fs, nodePath.resolve(path, file), callback);
        });
    }
    else if (stats.isFile()) {
        callback(path, stats);
    }
}
class MemoryFsZipper {
    constructor(fs, zipOtp = {}) {
        this.fs = fs;
        this.zipOtp = zipOtp;
        this.archive = new packer(zipOtp);
        this.appending = Promise.resolve();
        this.pEntry = (source, data) => {
            let p = new Promise((resolve, reject) => {
                this.archive.entry(source, data, (err, entry) => {
                    err ? reject(err) : resolve(entry);
                });
            });
            return p;
        };
    }
    entry(source, data) {
        this.appending = this.appending.then(() => this.pEntry(source, data));
    }
    directory(dir) {
        if (!this.fs.statSync(dir).isDirectory()) {
            return;
        }
        let self = this;
        matcher(self.fs, dir, (path, stats) => {
            let name = nodePath.relative(dir, path);
            if (!name) {
                return;
            }
            if (stats.isDirectory()) {
                self.entry(Buffer.concat([]), {
                    name,
                    date: stats.mtime,
                    mode: 493,
                    type: "directory"
                });
            }
            else if (stats.isFile()) {
                let entryData = {
                    name,
                    date: stats.mtime,
                    mode: 420,
                    type: "file"
                };
                let content = self.fs.readFileSync(path);
                if (content.length === 0) {
                    entryData.store = true;
                }
                self.entry(content, entryData);
            }
        });
    }
    file(file) {
        let stats = this.fs.statSync(file);
        if (!stats.isFile()) {
            return;
        }
        let name = nodePath.basename(file);
        this.entry(this.fs.readFileSync(file), {
            name,
            date: stats.mtime,
            mode: 420,
            type: "file"
        });
    }
    finalize() {
        this.appending.then(this.archive.finalize.bind(this.archive));
    }
    on(...args) {
        this.archive.on(...args);
    }
    pipe(...args) {
        this.archive.pipe(...args);
    }
    unpipe(...args) {
        this.archive.unpipe(...args);
    }
}
exports.default = MemoryFsZipper;
