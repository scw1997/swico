import { createApp, defineComponent, onErrorCaptured, ref } from 'vue';
import Layout from '../../src/layout/Layout';
import global from '../../src/global';
import { getRouter } from './history';

const Container = defineComponent({
    name: 'Container',
    setup(props) {
        const error = ref<string | null>(null);
        onErrorCaptured((err) => {
            error.value = err.toString();
            return false;
        });

        return { error };
    },

    template: '<SwicoLayout v-if="!error"></SwicoLayout>'
});

const router = getRouter();

// @ts-ignore
const app = createApp(Container);

app.component('SwicoLayout', Layout);
app.use(router);

const rootEle = document.createElement('div');
rootEle.id = 'swico-root';
document.body.appendChild(rootEle);

app.mount(rootEle);
//回调触发
global?.onInit?.(app, router);
