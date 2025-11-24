import { GlobalData, GlobalSwicoConfigType } from './main-config';
import { App, defineComponent } from 'vue';
import { Router, RouterLink } from 'vue-router';
import { useLocation, useNav } from './template-root/.swico-vue/hooks';
export type CustomConfigType = GlobalData['customConfig'];
export { RouterView } from 'vue-router';
export { useLocation, useNav };
export { history } from './mock-history';
export type { GlobalSwicoConfigType };

export const Outlet = defineComponent({
    name: 'Outlet',
    template: '<RouterView />'
});

export const Link = defineComponent({
    name: 'Link',
    props: {
        to: {
            required: true
        },
        replace: {
            type: Boolean
        }
    },
    setup(props) {
        const nav = useNav();
        return { nav };
    },

    template: `<a
        @click="
            () => {
                nav(to, { replace });
            }
        "
    >
        <slot></slot>
    </a>`
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
