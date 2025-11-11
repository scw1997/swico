import { createApp, defineComponent, onErrorCaptured, ref } from 'vue';
import Layout from '../../src/layout/Layout';
import global from '../../src/global';
import Loading from '../loading';
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

    template:
        ' <Layout v-if="!error">\n' +
        '            <RouterView v-slot="{ Component }">\n' +
        '                <template v-if="Component">\n' +
        '                    <Suspense>\n' +
        '                        <!-- 主要内容 -->\n' +
        '                        <component :is="Component"></component>\n' +
        '\n' +
        '                        <!-- 加载中状态 -->\n' +
        '                        <template #fallback>\n' +
        '                            <Loading />\n' +
        '                        </template>\n' +
        '                    </Suspense>\n' +
        '                </template>\n' +
        '            </RouterView>\n' +
        '        </Layout>'
});

const router = getRouter();

// @ts-ignore
const app = createApp(Container);

app.component('Layout', Layout);
app.component('Loading', Loading);

app.use(router);

//回调触发
global?.onInit?.(app, router);

app.mount('#root');
