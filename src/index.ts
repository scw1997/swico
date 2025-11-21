import { GlobalData, GlobalSwicoConfigType } from './main-config';
import { UseLocationType, UseNavType } from './typings/global-type';
import ReactLink from './project-path/.swico-react/Link';
import VueLink from './project-path/.swico-vue/Link';
import { Outlet as ReactOutlet } from './index.react';
import { Outlet as VueOutlet } from './index.vue';
import { App } from 'vue';
import { Router } from 'vue-router';
export type CustomConfigType = GlobalData['customConfig'];

export type { GlobalSwicoConfigType };

export { history } from './mock-history';

let Outlet: typeof ReactOutlet | typeof VueOutlet,
    Link: typeof ReactLink | typeof VueLink,
    useLocation: UseLocationType,
    useNav: UseNavType;
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
    onInit?: ((app: App, router: Router) => void) | (() => void);
}
export const defineGlobal: (config: DefineGlobalConfigType) => DefineGlobalConfigType = (config) =>
    config;
