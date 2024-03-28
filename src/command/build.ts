import webpack from 'webpack';
import getBuildConfig from '../config/webpack.prod';
import { getProjectConfig, GlobalData } from '../utils/config';
import chalk from 'chalk';
import ora from 'ora';
import { toast } from '../utils/tools';
const spinner = ora();
// 执行start本地启动
export default async function () {
    process.env.SECYWO_ENV = 'prod';
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
    spinner.start('Building...');
    compiler.run((err, stats) => {
        if (err) {
            toast.error(err.stack || err.toString());
            spinner.stop();
            return;
        }
        const info = stats.toJson();

        if (stats.hasErrors()) {
            toast.error(info.errors.map((item) => item.stack));
            spinner.stop();
            return;
        }

        if (stats.hasWarnings()) {
            toast.warning(info.warnings.map((item) => item.stack));
            spinner.stop();
        }
        spinner.succeed(`${chalk.green.bold('Building complete')} \n`);
    });
}
