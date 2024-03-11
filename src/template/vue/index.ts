import { createApp, defineComponent } from 'vue';
import routes from './routes';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes
});

const app = createApp(
    defineComponent({
        template: ' <RouterView />'
    })
);

app.use(router);

app.mount('#root');
