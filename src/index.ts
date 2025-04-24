import { GlobalData, GlobalSwicoConfigType } from './utils/config';
import { UseLocationType, UseNavType } from './typings/global-type';
export type CustomConfigType = GlobalData['customConfig'];

export type { GlobalSwicoConfigType };

export { history } from './mock-history';

let Outlet: any, Link: any, useLocation: UseLocationType, useNav: UseNavType;
export { Outlet, Link, useLocation, useNav };

//swico 配置
export interface DefineSwicoConfigType {
    (env: 'base', config: CustomConfigType['base']): CustomConfigType['base'];
    (env: 'dev', config: CustomConfigType['dev']): CustomConfigType['dev'];
    (env: 'prod', config: CustomConfigType['prod']): CustomConfigType['prod'];
}
export const defineConfig: DefineSwicoConfigType = (env, config) => config;
//swico global.ts 配置
export interface DefineGlobalConfigType {
    onInit?: (app, router) => void;
}
export const defineGlobal: (config: DefineGlobalConfigType) => DefineGlobalConfigType = (config) =>
    config;
