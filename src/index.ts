import { GlobalData } from './utils/tools';

export type ConfigType = GlobalData['customConfig'];

export interface DefineConfigType {
    (env: 'base', config: ConfigType['base']);
    (env: 'dev', config: ConfigType['dev']);
    (env: 'prod', config: ConfigType['prod']);
}

export const defineConfig: DefineConfigType = (env, config) => config;