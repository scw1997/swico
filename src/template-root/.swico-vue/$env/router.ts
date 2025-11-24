import { RouteRecordRaw } from 'vue-router';
import { ConfigRouterType } from '../../../main-config';

type RouteItem = RouteRecordRaw & {
    decorator?: string;
};

export const routes = [] as RouteItem[];

export const routerType: ConfigRouterType['type'] = 'browser';

export const routerBase: ConfigRouterType['base'] = '/';
