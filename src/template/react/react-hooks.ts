import { useLocation as useOriLocation, useParams, useNavigate } from 'react-router-dom';
import { pathNameList, compareURLPatterns, interpolatePath } from './$env/history';
import { SwicoLocationType, UseLocationType, UseNavType } from '../../typings/global-type';
import qs from 'qs';

export const useLocation: UseLocationType = () => {
    const location = useOriLocation();
    const params = useParams();

    const { search, hash, pathname, state } = location;

    const name = pathNameList.find(
        (item) =>
            (Object.keys(params).length > 0 && compareURLPatterns(pathname, item.path)) ||
            item.path === pathname
    )?.name;

    const query = search ? qs.parse(search.startsWith('?') ? search.slice(1) : search) : {};

    return {
        name,
        state: state ?? {},
        path: pathname,
        pathname: window?.location?.pathname,
        search: '',
        query,
        hash,
        params
    };
};

const getFormatNavPath = (to: SwicoLocationType): string => {
    const { params, path, hash, name, query } = to;
    const search = query ? `?${qs.stringify(query)}` : '';
    const formatHash = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '';
    const formatPath = name ? pathNameList.find((item) => item.name === name)?.path : path;

    let newPath = formatPath ? interpolatePath(formatPath, params || {}) : null;

    newPath = newPath + search + formatHash;

    return newPath;
};

export const useNav: UseNavType = () => {
    const navigate = useNavigate();
    const newNavigate = (to, options?) => {
        switch (typeof to) {
            case 'string':
                navigate(to, options);
                break;
            case 'number':
                navigate(to);
                break;
            case 'object':
                navigate(getFormatNavPath(to), { ...(options || {}), state: to.state });
                break;
            default:
                throw `An error occurred while executing useNav() operation: unexpected type of 'to':${typeof to}`;
        }
    };
    return newNavigate;
};
