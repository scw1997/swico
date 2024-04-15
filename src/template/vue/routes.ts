import { RouteRecordRaw } from 'vue-router';

type RouteItem = RouteRecordRaw & {
    decorator?: string;
};

export const routes = [] as RouteItem[];
