import { createApp, defineComponent } from 'vue';
import routes from './routes';
import { createRouter, createWebHistory } from 'vue-router';
import Layout from '../layout/Layout.vue';

const router = createRouter({
    history: createWebHistory('/'),
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
