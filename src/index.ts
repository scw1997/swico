import { GlobalData, GlobalConfigType } from './utils/config';

export type CustomConfigType = GlobalData['customConfig'];

export type { GlobalConfigType };

//secywo 配置
export interface DefineConfigType {
    (env: 'base', config: CustomConfigType['base']): CustomConfigType['base'];
    (env: 'dev', config: CustomConfigType['dev']): CustomConfigType['dev'];
    (env: 'prod', config: CustomConfigType['prod']): CustomConfigType['prod'];
}
export const defineConfig: DefineConfigType = (env, config) => config;

//secywo global.ts 配置
export interface DefineGlobalConfigType {
    initApp?: (app) => void;
}
export const defineGlobal: (config: DefineGlobalConfigType) => DefineGlobalConfigType = (config) =>
    config;

let Outlet: any, Link: any, useLocation: any;
export { Outlet, Link, useLocation };
