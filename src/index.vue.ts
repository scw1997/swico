import { GlobalData, GlobalConfigType } from './utils/config';
import { App, defineComponent } from 'vue';
import { RouterHistory, RouterLink } from 'vue-router';

export type CustomConfigType = GlobalData['customConfig'];
export { RouterView as Outlet } from 'vue-router';
export { useLocation } from './template/hooks/vue';
export type { GlobalConfigType };
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
export interface DefineConfigType {
    (env: 'base', config: CustomConfigType['base']);
    (env: 'dev', config: CustomConfigType['dev']);
    (env: 'prod', config: CustomConfigType['prod']);
}
export const defineConfig: DefineConfigType = (env, config) => config;

//secywo global.ts相关函数API

export type InitAppType = (app: App, router: RouterHistory) => void;
