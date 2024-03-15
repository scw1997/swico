import { GlobalData } from './utils/config';

export type ConfigType = GlobalData['customConfig'];

export interface DefineConfigType {
    (env: 'base', config: ConfigType['base']);
    (env: 'dev', config: ConfigType['dev']);
    (env: 'prod', config: ConfigType['prod']);
}

export const defineConfig: DefineConfigType = (env, config) => config;

export * as router from 'vue-router';
