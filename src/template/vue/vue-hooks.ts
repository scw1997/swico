import { useRoute, useRouter } from 'vue-router';
import qs from 'qs';
import { reactive, watchEffect } from 'vue';
import { routerBase } from './$env/config';
import { UseLocationType, UseNavType } from '../../typings/global-type';

export const getFormatRouterBase = (routerBase) => {
    const lastIndexBase = routerBase[routerBase.length - 1];
    //如果Base末尾为/，则忽略
    return lastIndexBase === '/' ? routerBase.slice(0, routerBase.length - 1) : routerBase;
};

export const useLocation: UseLocationType = () => {
    const route = useRoute();
    const location = reactive<ReturnType<UseLocationType>>({
        name: '',
        path: '',
        search: '',
        state: {},
        hash: '',
        pathname: '',
        params: {},
        query: {}
    });

    watchEffect(() => {
        const { hash, path, params, fullPath, query, name, meta } = route;
        const search = query ? qs.stringify(query) : '';
        location.name = name as string;
        location.path = path;
        location.pathname = getFormatRouterBase(routerBase) + path;
        location.search = search;
        location.query = query;
        location.hash = hash;
        location.params = params;
        location.state = window.history.state?.swicoState || {};
        location.custom = meta;
    });

    return location;
};

export const useNav: UseNavType = () => {
    const router = useRouter();
    const newNavigate = (to, options?) => {
        switch (typeof to) {
            case 'string':
                if (options?.replace) {
                    router.replace(to);
                } else {
                    router.push(to);
                }
                break;
            case 'number':
                router.go(to);
                break;
            case 'object':
                if (options?.replace) {
                    router.replace(to);
                } else {
                    router.push({ ...to, state: { swicoState: to.state } });
                }
                break;
            default:
                throw `An error occurred while executing useNav() operation: unexpected type of 'to':${typeof to}`;
        }
    };
    return newNavigate;
};
