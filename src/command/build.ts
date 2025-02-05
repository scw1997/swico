import webpack from 'webpack';
import getBuildConfig from '../config/webpack.prod';
import { getProjectConfig, GlobalData } from '../utils/config';
import { initIndexFile, toast } from '../utils/tools';
import packageJson from '../../package.json';
// 执行start本地启动
export default async function () {
    process.env.SWICO_ENV = 'prod';
    toast.info(`Swico v${packageJson.version}`);
    toast.info('Initializing production config...');
    await initIndexFile();
    const projectConfig = await getProjectConfig('prod');
    const { entryPath, templatePath, projectPath, customConfig, templateType } = projectConfig;
    const buildConfig = await getBuildConfig({
        entryPath,
        templatePath,
        projectPath,
        customConfig,
        templateType
    });
    const compiler = webpack(buildConfig as any);
    compiler.run((err, stats) => {
        if (err) {
            toast.error(err.stack || err.toString());
            return;
        }
        const info = stats.toJson();

        if (stats.hasErrors()) {
            toast.error(info.errors.map((item) => item.stack || item.message));
            return;
        }

        if (stats.hasWarnings()) {
            toast.warning(info.warnings.map((item) => item.stack || item.message));
        }
        toast.success('Build complete');
    });
}
