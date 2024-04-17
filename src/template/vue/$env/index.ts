import { createApp, defineComponent } from 'vue';
import routes from './routes';
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import Container from '../Container';
import { routerBase, routerType } from './config';
import Layout from '../../layout/Layout';
import global from '../../global';
import qs from 'qs';

const router = createRouter({
    history: (routerType === 'hash' ? createWebHashHistory : createWebHistory)(routerBase),
    routes
});
// @ts-ignore
const app = createApp(Container);
const Swico: Window['Swico'] = { history: null };

Swico.history = {
    push: (options) => {
        if (typeof options === 'string') {
            router.push(options);
        } else {
            const { query, name, hash, params, path } = options;
            // @ts-ignore
            router.push({ name, path, query, hash, params });
        }
    },
    replace: (options) => {
        if (typeof options === 'string') {
            router.replace(options);
        } else {
            const { query, name, hash, params, path } = options;
            // @ts-ignore
            router.replace({ name, path, query, hash, params });
        }
    },
    go: router.go,
    back: router.back,
    forward: router.forward,
    // @ts-ignore
    get location() {
        const lastIndexBase = routerBase[routerBase.length - 1];
        //如果Base末尾为/，则忽略
        const formatRouterBase =
            lastIndexBase === '/' ? routerBase.slice(0, routerBase.length - 1) : routerBase;
        const { path, params, query, name, hash, fullPath } = router.currentRoute.value;
        return {
            path,
            pathname: formatRouterBase + path,
            params,
            query,
            name,
            hash,
            search: query ? qs.stringify(query) : ''
        };
    }
} as SwicoHistoryType;
app.component('Layout', Layout);

app.use(router);

window.Swico = Swico;
//回调触发
global?.onInit?.(app, router);

app.mount('#root');
