import { GlobalData } from './utils/config';

export type ConfigType = GlobalData['customConfig'];

export interface DefineConfigType {
    (env: 'base', config: ConfigType['base']);
    (env: 'dev', config: ConfigType['dev']);
    (env: 'prod', config: ConfigType['prod']);
}

export const defineConfig: DefineConfigType = (env, config) => config;

export * from 'vue-router';

export { router as history } from './template/vue/index';
