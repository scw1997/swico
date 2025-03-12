import { createApp, defineComponent } from 'vue';
import Container from '../Container';
import Layout from '../../src/layout/Layout';
import global from '../../src/global';
import { getRouter } from './history';

const router = getRouter();

// @ts-ignore
const app = createApp(Container);

app.component('Layout', Layout);

app.use(router);

//回调触发
global?.onInit?.(app, router);

app.mount('#root');
