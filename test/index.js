const MemoryFs = require('memory-fs');
const MemoryFsZipper = require('../output/index').default;
const fs = require('fs');
const path = require('path');
let mfs = new MemoryFs();

mfs.mkdirSync('/dir');
mfs.writeFileSync('/dir/level0', 'level0', {encoding: 'utf8'});
mfs.mkdirSync('/dir/subdir');
mfs.writeFileSync('/dir/subdir/level1', 'level1', {encoding: 'utf8'});
mfs.mkdirSync('/dir/subdir/subsubdir');
mfs.writeFileSync('/dir/subdir/subsubdir/level2', 'level2', {encoding: 'utf8'});
let output = fs.createWriteStream(path.resolve(__dirname, '../ziptest.zip'));
let zipper = new MemoryFsZipper(mfs, {zlib: {level: 9}});
process.nextTick(() => {
    zipper.directory('/dir');
    zipper.pipe(output);
    zipper.finalize();
})