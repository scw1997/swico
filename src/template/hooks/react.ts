import { useLocation as useOriLocation, useParams } from 'react-router-dom';
import qs from 'qs';
import { RoutesItemType } from '../react';
import routes from '../react/routes';

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

//判断带params的path是否符合对应path的路由规则
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

//根据path找到定义路由中的name
const getNameByPath = (targetPath: string, params: Record<string, any>) => {
    let targetName;
    const checkRouteItem = (item: RoutesItemType, ancPath: string) => {
        const { path, name, children } = item;
        const newAncPath = `${ancPath.startsWith('/') ? ancPath : '/' + ancPath}${path.startsWith('/') ? path.slice(1) : path}`;
        if (params && compareURLPatterns(targetPath, newAncPath)) {
            targetName = name;
            return true;
        }
        if (newAncPath === targetPath) {
            targetName = name;
            return true;
        }
        if (children) {
            return children?.some((item) => checkRouteItem(item, newAncPath));
        }
        return false;
    };
    routes.some((item) => checkRouteItem(item, ''));
    console.log('targetName', targetName);
    return targetName;
};

export const useLocation: UseLocationType = () => {
    const location = useOriLocation();

    const params = useParams();

    const { search, hash, pathname } = location;

    const name = getNameByPath(pathname, params);

    const query = search ? qs.parse(search.startsWith('?') ? search.slice(1) : search) : {};

    return {
        name,
        path: pathname,
        pathname: window?.location?.pathname,
        search,
        query,
        hash,
        params
    };
};
