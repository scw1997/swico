import { useLocation as useOriLocation, useParams } from 'react-router-dom';
import { originalHistory } from '../react/history';
import qs from 'qs';

export interface UseLocationType {
    (): {
        name: string;
        path: string;
        pathname: string;
        search: string;
        query?: Record<string, any>;
        hash: string;
        params?: Record<string, any>;
    };
}

export const useLocation: UseLocationType = () => {
    const location = useOriLocation();
    const params = useParams();

    const { state, search, hash, pathname, key } = location;

    const query = search ? qs.parse(search) : {};

    return {
        name: key,
        path: pathname,
        pathname: originalHistory.location.pathname,
        search,
        query,
        state,
        hash,
        params
    };
};
