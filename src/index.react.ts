import { GlobalData, GlobalSwicoConfigType } from './main-config';
export type CustomConfigType = GlobalData['customConfig'];

export type { GlobalSwicoConfigType };

//二次封装link组件，统一只支持部分属性
export { default as Link } from './project-path/.swico-react/Link';

export { Outlet } from 'react-router';

export { useLocation, useNav } from './project-path/.swico-react/hooks';

export { history } from './mock-history';

//swico 配置
export interface DefineSwicoConfigType {
    (env: 'base', config: CustomConfigType['base']);
    (env: 'dev', config: CustomConfigType['dev']);
    (env: 'prod', config: CustomConfigType['prod']);
}

export const defineConfig: DefineSwicoConfigType = (env, config) => config;

//swico global.ts 配置

export type DefineGlobalConfigType = object;
export const defineGlobal: (config: DefineGlobalConfigType) => DefineGlobalConfigType = (config) =>
    config;
