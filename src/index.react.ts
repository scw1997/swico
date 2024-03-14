import { GlobalData } from './utils/config';
import { getHistory } from './template/history';
import { routerBase, routerType } from './template/react/config';

export type ConfigType = GlobalData['customConfig'];

export interface DefineConfigType {
    (env: 'base', config: ConfigType['base']);
    (env: 'dev', config: ConfigType['dev']);
    (env: 'prod', config: ConfigType['prod']);
}

export const defineConfig: DefineConfigType = (env, config) => config;

export * from 'react-router-dom';

const history = getHistory(routerBase, routerType);

export { history };
