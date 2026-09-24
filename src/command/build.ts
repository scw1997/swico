import getBuildConfig from '../rsbuild-config/config.prod';
import { getProjectConfig, GlobalDataType } from '../main-config';
import { toast } from '../utils';
import packageJson from '../../package.json';
import { createRsbuild } from '@rsbuild/core';
import path from 'path';
import fs from 'fs-extra';

// 执行start本地启动
export default async function () {
    process.env.SWICO_ENV = 'prod';
    toast.info(`Swico v${packageJson.version}`);
    toast.info('Initializing production config...');
    const projectConfig = await getProjectConfig('prod');
    const { entryPath, templatePath, projectPath, customConfig, templateType } = projectConfig;
    const buildConfig = await getBuildConfig({
        entryPath,
        templatePath,
        projectPath,
        customConfig,
        templateType
    });
    const rsbuild = await createRsbuild({ config: buildConfig });
    let now;
    rsbuild.onAfterBuild(async ({ stats }) => {
        if (stats.hasErrors()) {
            const info = stats.toJson({ all: true });
            toast.error(info.errors.map((item) => item.stack || item.message));
            return;
        }
        // if (stats.hasWarnings()) {
        //     const info = stats.toJson({ all: true });
        //     toast.warning(info.warnings.map((item) => item.stack || item.message));
        // }

        const duration = Date.now() - now;
        toast.success(`Build complete in ${(duration / 1000).toFixed(2)}s`);

        //处理swico模块导出index.js文件中history的引入路径，由从prod改成引用dev的history（避免开发模式下打包build后开发模式的history就不可用了）
        const entryFilePath = path.resolve(projectPath, './.swico/index.js');
        let replaceEntryText = await fs.readFile(entryFilePath, 'utf8');
        replaceEntryText = replaceEntryText.replaceAll(
            '.swico/.prod/history.js',
            '.swico/.dev/history.js'
        );
        await fs.outputFile(entryFilePath, replaceEntryText);
    });
    //启动
    toast.info('Building...');
    now = Date.now();
    await rsbuild.build();
}
