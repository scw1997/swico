import portFinder from 'portfinder';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

//复制文件夹
export const copyDirFiles = async (src, dest, filter?: (fileName) => boolean) => {
    const _copy = async (src, dest) => {
        const files = await fs.readdir(src);
        //过滤文件
        const filterFiles = files.filter((fileName) => (filter ? filter(fileName) === true : true));
        for await (const file of filterFiles) {
            const srcPath = path.join(src, file);
            const destPath = path.join(dest, file);
            const srcStat = await fs.stat(srcPath);
            if (srcStat.isDirectory()) {
                // 如果是目录，则递归复制
                _copy(srcPath, destPath);
            } else {
                // 如果是文件，则直接复制
                await fs.copyFile(srcPath, destPath);
            }
        }
        return null; // 所有文件复制完成后调用回调
    };

    try {
        await fs.access(dest);
    } catch (e) {
        // 如果目标文件夹不存在，则创建它
        await fs.mkdir(dest, { recursive: true });
    }
    await _copy(src, dest);
};

//获取随机可用的接口（解决devServer接口占用报错的问题）
export const getPort = () => {
    return portFinder.getPortPromise({
        port: 3000, // minimum port
        stopPort: 3333 //
    });
};
export const colorConfig = {
    theme: '#7888FCFF',
    warning: '#fb8918',
    success: '#32f264',
    error: '#ff0000'
};

interface ToastOptions {
    wrap?: boolean;
    inline?: boolean;
    title?: string;
}
export const toast = {
    info: (message: string, options?: ToastOptions) => {
        const { wrap = false } = options || {};
        console.log(`${chalk.hex(colorConfig.theme).bold('info')} - ${message}${wrap ? '\n' : ''}`);
    },
    success: (message: string, options?: ToastOptions) => {
        const { wrap = true } = options || {};
        console.log(
            `${chalk.hex(colorConfig.success).bold('info')} - ${message}${wrap ? '\n' : ''}`
        );
    },
    error: (message: string | string[], options?: ToastOptions) => {
        const { inline, title } = options || {};
        if (inline) {
            console.log(`${chalk.red.bold('error')} - ${message}`);
        } else {
            // console.log('message',message);
            if (Array.isArray(message)) {
                if (message.length > 0) {
                    console.log(`${chalk.red.bold('error')} - ${title || 'Swico errors'}：`);
                }
                message.forEach((item) => {
                    console.log(`> ${chalk.red.bold(item)}`);
                });
            } else if (message) {
                console.log(`${chalk.red.bold('error')} - ${title || 'Swico errors'}：`);
                console.log(`> ${chalk.red.bold(message)}`);
            }
        }
    },
    warning: (message: string | string[], options?: ToastOptions) => {
        const { inline, title } = options || {};
        const { warning: color } = colorConfig;
        if (inline) {
            console.log(`${chalk.hex(color).bold('warning')} - ${message}`);
        } else {
            console.log(`${chalk.hex(color).bold('warning')} - ${title || ' Swico warnings'}：`);
            if (Array.isArray(message)) {
                message.forEach((item) => {
                    console.log(`> ${chalk.hex(color).bold(item)}`);
                });
            } else if (message) {
                console.log(`> ${chalk.hex(color).bold(message)}`);
            }
        }
    }
};
