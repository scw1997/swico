import fs from 'fs-extra';
import path from 'path';
const main = () => {
    //将部分用到的非ts/js文件复制到dist目录下
    fs.copyFileSync(
        path.resolve(__dirname, './src/template/layout/Layout.vue'),
        path.resolve(__dirname, './dist/src/template/layout/Layout.vue')
    );
};
main();
