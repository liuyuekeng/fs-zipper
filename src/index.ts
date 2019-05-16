import * as packer from 'zip-stream';
import * as nodePath from 'path';
import {MyFs, Archive} from './interface';
import { Stats } from 'fs';
import { Stream } from 'stream';

function matcher(fs: MyFs, path: string, callback: Function) {
    let stats = fs.statSync(path);
    if (stats.isDirectory(fs)) {
        callback(path, stats);
        let files = fs.readdirSync(path);
        files.forEach(file => {
            matcher(fs, nodePath.resolve(path, file), callback);
        });
    } else if (stats.isFile()) {
        callback(path, stats);
    }
}

export default class MemoryFsZipper {
    archive: Archive
    appending: Promise<any>
    pEntry: Function
    constructor(public fs: MyFs, public zipOtp: object = {}) {
        this.archive = new packer(zipOtp);
        this.appending = Promise.resolve();
        this.pEntry = (source: string|Buffer|Stream, data: object) => {
            let p = new Promise((resolve, reject) => {
                this.archive.entry(source, data, (err, entry) => {
                    err ? reject(err) : resolve(entry);
                });
            })
            return p;
        }
    }
    entry(source: string|Buffer|Stream, data: object) {
        this.appending = this.appending.then(() => this.pEntry(source, data));
    }
    directory(dir: string) {
        if (!this.fs.statSync(dir).isDirectory()) {
            return;
        }
        let self = this;
        matcher(self.fs, dir, (path: string, stats: Stats) => {
            let name = nodePath.relative(dir, path);
            if (!name) {
                return;
            }
            if (stats.isDirectory()) {
                self.entry(Buffer.concat([]), {
                    name,
                    date: stats.mtime,
                    mode: 493,
                    type:"directory"
                })
            } else if (stats.isFile()) {
                self.entry(self.fs.readFileSync(path), {
                    name,
                    date: stats.mtime,
                    mode: 420,
                    type: "file"
                });
            }
        });
    }
    file(file: string) {
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