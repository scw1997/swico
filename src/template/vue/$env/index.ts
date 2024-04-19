import { createApp, defineComponent } from 'vue';
import Container from '../Container';
import Layout from '../../layout/Layout';
import global from '../../global';
import { getRouter, history } from './history';

const router = getRouter();

// @ts-ignore
const app = createApp(Container);
const Swico: Window['Swico'] = { history: null };

Swico.history = history;
app.component('Layout', Layout);

app.use(router);

window.Swico = Swico;
//回调触发
global?.onInit?.(app, router);

app.mount('#root');
