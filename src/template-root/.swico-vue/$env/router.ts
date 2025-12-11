import { RouteRecordRaw } from 'vue-router';
import { ConfigRouterType } from '../../../main-config';

export type RouteItem = RouteRecordRaw & {
    decorator?: string;
    custom?: any;
};

export const routes = [] as RouteItem[];

export const routerType: ConfigRouterType['type'] = 'browser';

export const routerBase: ConfigRouterType['base'] = '/';
