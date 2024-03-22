import { GlobalData, GlobalConfigType } from './utils/config';

export type CustomConfigType = GlobalData['customConfig'];

export type { GlobalConfigType };

export interface DefineConfigType {
    (env: 'base', config: CustomConfigType['base']);
    (env: 'dev', config: CustomConfigType['dev']);
    (env: 'prod', config: CustomConfigType['prod']);
}

export const defineConfig: DefineConfigType = (env, config) => config;

export type { NavigationType, NavigationOptionType } from './template/react/history';

export { useRouter, useRoute, useLink, RouterView, RouterLink } from 'vue-router';
