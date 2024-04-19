import { createApp, defineComponent } from 'vue';
import Container from '../Container';
import Layout from '../../layout/Layout';
import global from '../../global';
import { getRouter } from './history';

const router = getRouter();

// @ts-ignore
const app = createApp(Container);

app.component('Layout', Layout);

app.use(router);

//回调触发
global?.onInit?.(app, router);

app.mount('#root');
