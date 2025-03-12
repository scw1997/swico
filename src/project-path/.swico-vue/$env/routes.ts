import { RouteRecordRaw } from 'vue-router';

type RouteItem = RouteRecordRaw & {
    decorator?: string;
};

export default [] as RouteItem[];
