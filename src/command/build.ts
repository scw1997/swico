import webpack from 'webpack';
import getBuildConfig from '../config/webpack.prod';
import { getProjectConfig, GlobalData } from '../utils/tools';
import chalk from 'chalk';
import ora from 'ora';
const spinner = ora();
const { TEMPLATE } = process.env;
// 执行start本地启动
export default async function () {
    const projectConfig = await getProjectConfig(TEMPLATE as GlobalData['templateType']);
    const { entryPath, templatePath, projectPath, customConfig, templateType } = projectConfig;
    const buildConfig = await getBuildConfig({
        entryPath,
        templatePath,
        projectPath,
        customConfig,
        templateType,
    });
    const compiler = webpack(buildConfig as any);
    spinner.start('Building...');
    compiler.run((err, stats) => {
        if (err) {
            console.log(`- ${chalk.red.bold(err.stack || err)} \n`);
            spinner.stop();
            return;
        }
        const info = stats.toJson();

        if (stats.hasErrors()) {
            console.log(`- ${chalk.bold('There are some errors：')} \n`);

            info.errors.forEach((item) => {
                console.log(`- ${chalk.red.bold(item.stack)} \n`);
            });
            spinner.stop();
            return;
        }

        if (stats.hasWarnings()) {
            console.log(`- ${chalk.bold('There are some warnings：')} \n`);

            info.warnings.forEach((item) => {
                console.log(`- ${chalk.yellow.bold(item.stack)} \n`);
            });
            spinner.stop();
        }
        spinner.succeed(`${chalk.green.bold('Building complete')} \n`);
    });
}
