import getBuildConfig from '../rsbuild-config/config.prod';
import { getProjectConfig, GlobalDataType } from '../main-config';
import { toast } from '../utils';
import packageJson from '../../package.json';
import { createRsbuild } from '@rsbuild/core';
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
    //启动
    toast.info('Building...');
    const now = Date.now();
    rsbuild.onAfterBuild(({ stats }) => {
        if (stats.hasErrors()) {
            const info = stats.toJson({ all: true });
            toast.error(info.errors.map((item) => item.stack || item.message));
            return;
        }
        if (stats.hasWarnings()) {
            const info = stats.toJson({ all: true });
            toast.warning(info.warnings.map((item) => item.stack || item.message));
        }

        const duration = Date.now() - now;
        toast.success(`Build complete in ${(duration / 1000).toFixed(2)}s`);
    });
}
