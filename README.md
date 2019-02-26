zip file or directory of given file
you can use memory-fs or other file system

exp.
```
import FsZipper from 'fs-zipper';

let zipper = new FsZipper(fs, {zlib: {level: 9}});
zipper.directory('/dir');
zipper.pipe(fs.createWriteStream(path.resolve(__dirname, '../ziptest.zip')));
zipper.finalize();
```

FsZipper(fs, zipopt)
---

- fs <FileSystem>
- zipopt <object>

fsZipper.entry(source, data)
fsZipper.directory(dirPath)
fsZipper.finalize()
fsZipper.on(evnet, callback)
fsZipper.pipe(stream)
fsZipper.unpipe(stream)