import { RouteRecordRaw } from 'vue-router';

type RouteItem = RouteRecordRaw & {
    auth?: string;
};

export default [] as RouteItem[];
