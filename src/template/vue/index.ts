import { createApp, defineComponent } from 'vue';
import routes from './routes';
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import Container from './Container';
import { routerBase, routerType } from './config';
import Layout from '../layout/Layout';
import { NavigationType } from '../react/history';

const router = createRouter({
    history: (routerType === 'hash' ? createWebHashHistory : createWebHistory)(routerBase),
    routes
});
// @ts-ignore
const app = createApp(Container);

window.Navigation = {
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
} as NavigationType;
window.App = app;

app.component('Layout', Layout);

app.use(router);

app.mount('#root');
