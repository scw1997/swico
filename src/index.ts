import { GlobalData, GlobalConfigType } from './utils/config';

export type CustomConfigType = GlobalData['customConfig'];

export type { GlobalConfigType };

export interface DefineConfigType {
    (env: 'base', config: CustomConfigType['base']);
    (env: 'dev', config: CustomConfigType['dev']);
    (env: 'prod', config: CustomConfigType['prod']);
}
export const defineConfig: DefineConfigType = (env, config) => config;

let Outlet: any, Link: any, useLocation: any;
export { Outlet, Link, useLocation };
