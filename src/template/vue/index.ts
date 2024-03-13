import { createApp, defineComponent } from 'vue';
import routes from './routes';
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import Layout from '../layout/Layout.vue';
import { routerBase, routerType } from './config';

const router = createRouter({
    history: (routerType === 'hash' ? createWebHashHistory : createWebHistory)(routerBase),
    routes
});

const app = createApp(
    defineComponent({
        template: '<Layout><RouterView /></Layout>'
    })
);

app.component('Layout', Layout);

app.use(router);

app.mount('#root');
