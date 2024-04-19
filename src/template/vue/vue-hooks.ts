import { useRoute } from 'vue-router';
import qs from 'qs';
import { reactive, watchEffect } from 'vue';
import { routerBase } from './$env/config';
import { UseLocationType } from '../../global-type';

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
        hash: '',
        pathname: '',
        params: {},
        query: {}
    });

    watchEffect(() => {
        const { hash, path, params, fullPath, query, name } = route;
        const search = query ? qs.stringify(query) : '';
        location.name = name as string;
        location.path = path;
        location.pathname = getFormatRouterBase(routerBase) + path;
        location.search = search;
        location.query = query;
        location.hash = hash;
        location.params = params;
    });

    return location;
};
