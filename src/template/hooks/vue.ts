import { useRoute } from 'vue-router';
import qs from 'qs';
import { UseLocationType } from './react';

export const useLocation: UseLocationType = () => {
    const route = useRoute();

    const { hash, path, params, fullPath, query, name } = route;

    const search = query ? qs.stringify(query) : '';
    return {
        name: name as string,
        path,
        pathname: fullPath,
        search,
        query,
        hash,
        params
    };
};
