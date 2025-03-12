import fs from 'fs-extra';
import path from 'path';

const copyVueFiles = async () => {
    const filePath = path.resolve(__dirname, './project-path/.swico-vue/Container.vue');
    const targetPath = path.resolve(__dirname, '../dist/src/project-path/.swico-vue/Container.vue');
    await fs.copyFile(filePath, targetPath);
};
const copyReadMeFiles = async () => {
    const filePath = path.resolve(__dirname, '../README.md');
    const targetPath = path.resolve(__dirname, '../dist/README.md');
    await fs.copyFile(filePath, targetPath);
};
const main = () => {
    copyVueFiles();
    copyReadMeFiles();
};
main();
