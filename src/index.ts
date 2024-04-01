import { GlobalData, GlobalSecywoConfigType } from './utils/config';

export type CustomConfigType = GlobalData['customConfig'];

export type { GlobalSecywoConfigType };

let Outlet: any, Link: any, useLocation: any;
export { Outlet, Link, useLocation };

//secywo 配置
export interface DefineSecywoConfigType {
    (env: 'base', config: CustomConfigType['base']): CustomConfigType['base'];
    (env: 'dev', config: CustomConfigType['dev']): CustomConfigType['dev'];
    (env: 'prod', config: CustomConfigType['prod']): CustomConfigType['prod'];
}
export const defineConfig: DefineSecywoConfigType = (env, config) => config;
//secywo global.ts 配置
export interface DefineGlobalConfigType {
    onInit?: (app, router) => void;
}
export const defineGlobal: (config: DefineGlobalConfigType) => DefineGlobalConfigType = (config) =>
    config;
