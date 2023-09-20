#! /usr/bin/env node

// //初始化secywo项目
import { program } from 'commander';
import handleStartDevServer from './command/start';
import handleBuild from './command/build';

//支持直接引入ts或es6模块
import('ts-node/register');

//项目启动开发环境服务
program
    .command('start')
    .description('start the development environment service')
    .action(() => {
        handleStartDevServer();
    });

//打包构建
program
    .command('build')
    .description('package to build the output product')
    .action(() => {
        handleBuild();
    });
// 解析用户执行命令传入参数
program.parse(process.argv);
