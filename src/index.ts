import { GlobalData, GlobalConfigType } from './utils/config';

export type CustomConfigType = GlobalData['customConfig'];

export type { GlobalConfigType };

let Outlet: any, Link: any, useLocation: any;
export { Outlet, Link, useLocation };

//secywo 配置
export interface DefineConfigType {
    (env: 'base', config: CustomConfigType['base']): CustomConfigType['base'];
    (env: 'dev', config: CustomConfigType['dev']): CustomConfigType['dev'];
    (env: 'prod', config: CustomConfigType['prod']): CustomConfigType['prod'];
}
export const defineConfig: DefineConfigType = (env, config) => config;

//secywo global.ts相关函数API

export type InitAppType = (app: any, router: any) => void;
