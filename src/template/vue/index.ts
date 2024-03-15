import { createApp, defineComponent } from 'vue';
import routes from './routes';
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import Layout from '../layout/layout';
import { routerBase, routerType } from './config';

export const router = createRouter({
    history: (routerType === 'hash' ? createWebHashHistory : createWebHistory)(routerBase),
    routes
});

const app = createApp(
    defineComponent({
        data(vm) {
            return { router, app };
        },
        template: '<Layout :history="router" :app="app"><RouterView /></Layout>'
    })
);

app.component('Layout', Layout);

app.use(router);

app.mount('#root');
