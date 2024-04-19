import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import { routerBase, routerType } from './config';
import routes from './routes';
import qs from 'qs';

export let history: SwicoHistoryType;

export const getRouter = () => {
    const router = createRouter({
        history: (routerType === 'hash' ? createWebHashHistory : createWebHistory)(routerBase),
        routes
    });

    history = {
        push: (options) => {
            if (typeof options === 'string') {
                router.push(options);
            } else {
                const { query, name, hash, params, path } = options;
                // @ts-ignore
                router.push({ name, path, query, hash, params });
            }
        },
        replace: (options) => {
            if (typeof options === 'string') {
                router.replace(options);
            } else {
                const { query, name, hash, params, path } = options;
                // @ts-ignore
                router.replace({ name, path, query, hash, params });
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
            const { path, params, query, name, hash, fullPath } = router.currentRoute.value;
            return {
                path,
                pathname: formatRouterBase + path,
                params,
                query,
                name,
                hash,
                search: query ? qs.stringify(query) : ''
            };
        }
    } as SwicoHistoryType;

    return router;
};
