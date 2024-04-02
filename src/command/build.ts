import webpack from 'webpack';
import getBuildConfig from '../config/webpack.prod';
import { getProjectConfig, GlobalData } from '../utils/config';
import chalk from 'chalk';
import ora from 'ora';
import { toast } from '../utils/tools';
const spinner = ora();
// 执行start本地启动
export default async function () {
    process.env.SWICO_ENV = 'prod';
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
    console.log(`${chalk.hex('#5f72f5')('Swico starts building....')} \n`);
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
