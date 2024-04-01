import { createApp, defineComponent } from 'vue';
import routes from './routes';
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import Container from './Container';
import { routerBase, routerType } from './config';
import Layout from '../layout/Layout';
import global from '../global';

const router = createRouter({
    history: (routerType === 'hash' ? createWebHashHistory : createWebHistory)(routerBase),
    routes
});
// @ts-ignore
const app = createApp(Container);
const Secywo: Window['Secywo'] = { history: null };

Secywo.history = {
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
    back: router.back
    // eslint-disable-next-line no-undef
} as SecywoHistoryType;
app.component('Layout', Layout);

app.use(router);

window.Secywo = Secywo;
//回调触发
global?.onInit?.(app, router);

app.mount('#root');
