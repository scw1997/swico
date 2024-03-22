import { createApp, defineComponent } from 'vue';
import routes from './routes';
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import Container from './Container';
import { routerBase, routerType } from './config';
import Layout from '../layout/Layout';

const router = createRouter({
    history: (routerType === 'hash' ? createWebHashHistory : createWebHistory)(routerBase),
    routes
});

// @ts-ignore
const app = createApp(Container);

const { push, replace, go, back } = router;

window.Navigation = {
    push,
    replace,
    go,
    back
};
window.App = app;

app.component('Layout', Layout);

app.use(router);

app.mount('#root');
