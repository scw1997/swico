import { useRoute } from 'vue-router';
import qs from 'qs';
import { UseLocationType } from './react';
import { reactive, watch, watchEffect } from 'vue';

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
        console.log('123');
        const { hash, path, params, fullPath, query, name } = route;
        const search = query ? qs.stringify(query) : '';
        location.name = name as string;
        location.path = path;
        location.pathname = fullPath;
        location.search = search;
        location.query = query;
        location.hash = hash;
        location.params = params;
    });

    return location;
};
