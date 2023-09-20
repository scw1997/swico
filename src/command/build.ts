import webpack from 'webpack';
import getBuildConfig from '../config/webpack.prod';
import { getProjectConfig } from '../utils/tools';
import chalk from 'chalk';

// 执行start本地启动
export default async function () {
    const projectConfig = await getProjectConfig();
    const { entryPath, templatePath, projectPath, cliConfig } = projectConfig;
    const buildConfig = getBuildConfig({ entryPath, templatePath, projectPath, cliConfig });
    const compiler = webpack(buildConfig as any);

    compiler.run((err, stats) => {
        // [Stats Object](#stats-object)
        if (err) {
            console.log(`- ${chalk.red.bold(err.stack || err)} \n`);

            return;
        }
        const info = stats.toJson();

        if (stats.hasErrors()) {
            console.log(`- ${chalk.bold('There are some errors：')} \n`);

            info.errors.forEach((item) => {
                console.log(`- ${chalk.red.bold(item.stack)} \n`);
            });

            return;
        }

        if (stats.hasWarnings()) {
            console.log(`- ${chalk.bold('There are some warnings：')} \n`);

            info.warnings.forEach((item) => {
                console.log(`- ${chalk.yellow.bold(item.stack)} \n`);
            });
        }

        compiler.close((closeErr) => {
            if (closeErr) {
                console.log(`- ${chalk.bold('There are some errors：')} \n`);

                console.log(`- ${chalk.red.bold(closeErr.toString())} \n`);
            }
        });
    });
}
