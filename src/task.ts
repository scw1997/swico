import fs from 'fs-extra';
import path from 'path';

const copyReadMeFiles = async () => {
    const filePath = path.resolve(__dirname, '../README.md');
    const targetPath = path.resolve(__dirname, '../dist/README.md');
    await fs.copyFile(filePath, targetPath);
};
const main = () => {
    copyReadMeFiles();
};
main();
