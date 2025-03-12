import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import { routerBase, routerType } from './config';
import routes from './routes';
import qs from 'qs';
import { SwicoHistoryType } from '../../../typings/global-type';

export let history: SwicoHistoryType;

const transformRouteItemCustomToMeta = (routeItem) => {
    const newRouteItem = { ...routeItem };
    const { custom, children } = routeItem;
    newRouteItem.meta = custom;
    return {
        ...newRouteItem,
        children: children?.map((item) => transformRouteItemCustomToMeta(item))
    };
};

const formatRoutes = routes.map((routeItem) => transformRouteItemCustomToMeta(routeItem));

export const getRouter = () => {
    const router = createRouter({
        history: (routerType === 'hash' ? createWebHashHistory : createWebHistory)(routerBase),
        routes: formatRoutes
    });

    history = {
        push: (options) => {
            if (typeof options === 'string') {
                router.push(options);
            } else {
                const { query, name, hash, params, path, state } = options;
                // @ts-ignore
                router.push({ name, path, query, hash, params, state: { swicoState: state } });
            }
        },
        replace: (options) => {
            if (typeof options === 'string') {
                router.replace(options);
            } else {
                const { query, name, hash, params, path, state } = options;
                // @ts-ignore
                router.replace({ name, path, query, hash, params, state: { swicoState: state } });
            }
        },
        go: router.go,
        back: router.back,
        forward: router.forward,
        // @ts-ignore
        get location() {
            const lastIndexBase = routerBase[routerBase.length - 1];

            //如果Base末尾为/，则忽略
            const formatRouterBase =
                lastIndexBase === '/' ? routerBase.slice(0, routerBase.length - 1) : routerBase;
            const { path, params, query, name, hash, fullPath, meta } = router.currentRoute.value;
            return {
                path,
                custom: meta,
                pathname: formatRouterBase + path,
                params,
                query,
                name,
                hash,
                state: window.history.state?.swicoState ?? {},
                search: query ? qs.stringify(query) : ''
            };
        }
    } as SwicoHistoryType;

    return router;
};
