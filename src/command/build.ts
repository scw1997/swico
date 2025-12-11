import getBuildConfig from '../rspack-config/rspack.prod';
import { getProjectConfig, GlobalDataType } from '../main-config';
import { toast } from '../utils';
import packageJson from '../../package.json';
import { rspack } from '@rspack/core';
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
    const compiler = rspack(buildConfig as any);
    toast.info('Building...');
    const now = Date.now();
    compiler.run((err, stats) => {
        if (err) {
            toast.error(err.stack || err.toString());
            return;
        }
        if (stats.hasErrors()) {
            // @ts-ignore
            const info = stats.toJson();
            toast.error(info.errors.map((item) => item.stack || item.message));
            return;
        }
        if (stats.hasWarnings()) {
            // @ts-ignore
            const info = stats.toJson();
            toast.warning(info.warnings.map((item) => item.stack || item.message));
        }

        const duration = Date.now() - now;
        toast.success(`Build complete in ${(duration / 1000).toFixed(2)}s`);
    });
}
