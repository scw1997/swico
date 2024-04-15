import routes from './routes';
import { useLocation as useOriLocation, useParams } from 'react-router-dom';
import { getPathNameList } from './history';
import qs from 'qs';

const compareURLPatterns = (urlPatternWithValues: string, urlPatternWithParams: string) => {
    const patternWithValuesParts = urlPatternWithValues.split('/');
    const patternWithParamsParts = urlPatternWithParams.split('/');

    // 确保两个路径具有相同数量的部分
    if (patternWithValuesParts.length !== patternWithParamsParts.length) {
        return false;
    }

    // 遍历每个部分进行比较
    for (let i = 0; i < patternWithValuesParts.length; i++) {
        const valuePart = patternWithValuesParts[i];
        const paramPart = patternWithParamsParts[i];

        // 检查是否是参数占位符，并跳过空部分（比如URL开头或结尾的/）
        if (paramPart.startsWith(':') && paramPart !== '') {
            // 是参数占位符，则继续下一个部分的比较
            continue;
        }

        // 非参数占位符的部分必须严格相等
        if (valuePart !== paramPart) {
            return false;
        }
    }

    // 所有部分都匹配
    return true;
};

export const useLocation: UseLocationType = () => {
    console.log('useLocationRoutes', routes);
    const location = useOriLocation();
    const params = useParams();

    const { search, hash, pathname } = location;

    const pathNameList = getPathNameList(routes);

    const name = pathNameList.find(
        (item) =>
            (Object.keys(params).length > 0 && compareURLPatterns(pathname, item.path)) ||
            item.path === pathname
    )?.name;

    const query = search ? qs.parse(search.startsWith('?') ? search.slice(1) : search) : {};

    return {
        name,
        path: pathname,
        pathname: window?.location?.pathname,
        search: '',
        query,
        hash,
        params
    };
};
