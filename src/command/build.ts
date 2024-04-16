import webpack from 'webpack';
import getBuildConfig from '../config/webpack.prod';
import { getProjectConfig, GlobalData } from '../utils/config';
import chalk from 'chalk';
import ora from 'ora';
import { initIndexFile, toast } from '../utils/tools';
import packageJson from '../../package.json';
const spinner = ora();
// 执行start本地启动
export default async function () {
    process.env.SWICO_ENV = 'prod';
    toast.info(`Swico v${packageJson.version}`);
    spinner.start('Initializing Swico production config...\n');
    const projectConfig = await getProjectConfig('prod');
    const { entryPath, templatePath, projectPath, customConfig, templateType } = projectConfig;
    initIndexFile(templateType);
    const buildConfig = await getBuildConfig({
        entryPath,
        templatePath,
        projectPath,
        customConfig,
        templateType
    });
    spinner.succeed();
    const compiler = webpack(buildConfig as any);
    compiler.run((err, stats) => {
        if (err) {
            toast.error(err.stack || err.toString());
            return;
        }
        const info = stats.toJson();

        if (stats.hasErrors()) {
            toast.error(info.errors.map((item) => item.stack));
            return;
        }

        if (stats.hasWarnings()) {
            toast.warning(info.warnings.map((item) => item.stack));
        }
        spinner.succeed(`${chalk.green.bold('Building complete')} \n`);
    });
}
