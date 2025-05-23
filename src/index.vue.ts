import { GlobalData, GlobalSwicoConfigType } from './utils/config';
import { App, defineComponent } from 'vue';
import { Router, RouterLink } from 'vue-router';
export type CustomConfigType = GlobalData['customConfig'];
export { RouterView as Outlet } from 'vue-router';
export { useLocation, useNav } from './project-path/.swico-vue/vue-hooks';
export { history } from './mock-history';
export type { GlobalSwicoConfigType };
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

//swico 配置
export interface DefineSwicoConfigType {
    (env: 'base', config: CustomConfigType['base']);
    (env: 'dev', config: CustomConfigType['dev']);
    (env: 'prod', config: CustomConfigType['prod']);
}
export const defineConfig: DefineSwicoConfigType = (env, config) => config;

//swico global.ts 配置
export interface DefineGlobalConfigType {
    onInit?: (app: App, router: Router) => void;
}

export const defineGlobal: (config: DefineGlobalConfigType) => DefineGlobalConfigType = (config) =>
    config;
