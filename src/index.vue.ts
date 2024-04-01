import { GlobalData, GlobalSecywoConfigType } from './utils/config';
import { App, defineComponent } from 'vue';
import { Router, RouterLink } from 'vue-router';

export type CustomConfigType = GlobalData['customConfig'];
export { RouterView as Outlet } from 'vue-router';
export { useLocation } from './template/hooks/vue';
export type { GlobalSecywoConfigType };
//二次封装link组件，只支持部分属性
export const Link = defineComponent({
    components: {
        RouterLink
    },
    props: {
        to: {
            type: String
        },
        replace: {
            type: Boolean
        }
    },
    template: '<RouterLink :to="to" :replace="replace" ><slot></slot></RouterLink>'
});

//secywo 配置
export interface DefineSecywoConfigType {
    (env: 'base', config: CustomConfigType['base']);
    (env: 'dev', config: CustomConfigType['dev']);
    (env: 'prod', config: CustomConfigType['prod']);
}
export const defineConfig: DefineSecywoConfigType = (env, config) => config;

//secywo global.ts 配置
export interface DefineGlobalConfigType {
    onInit?: (app: App, router: Router) => void;
}

export const defineGlobal: (config: DefineGlobalConfigType) => DefineGlobalConfigType = (config) =>
    config;
