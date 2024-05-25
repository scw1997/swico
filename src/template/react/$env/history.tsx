import { RoutesItemType } from './index';
import qs from 'qs';
import routes from './routes';
import { routerBase, routerType } from './config';
import {
    SwicoHistoryOptionType,
    SwicoHistoryType,
    SwicoLocationType
} from '../../../typings/global-type';

const lastIndexBase = routerBase[routerBase.length - 1];
//如果Base末尾为/，则忽略
const formatRouterBase =
    lastIndexBase === '/' ? routerBase.slice(0, routerBase.length - 1) : routerBase;

export const compareURLPatterns = (urlPatternWithValues: string, urlPatternWithParams: string) => {
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

//根据params对象和路径模板获取具体的路径值
export const interpolatePath = (pathTemplate: string, params: Record<string, any>) => {
    const pathParts = pathTemplate.split('/');
    const interpolatedParts = pathParts.map((part) => {
        // 查找参数（以:开头和结尾）
        const paramMatch = part.match(/^\:(.+)$/);
        if (paramMatch) {
            // 如果找到了参数，使用params对象中的对应值替换
            const paramName = paramMatch[1];
            if (params[paramName]) {
                return params[paramName];
            } else {
                // 如果params中没有对应的值，则抛出错误
                throw `Missing required params '${paramName}'`;
            }
        }
        return part;
    });

    // 将替换后的部分重新组合成完整的路径
    return interpolatedParts.join('/');
};

//根据路径模板和路径值获取params对象
const interpolatePathParams = (pathTemplate: string = '', path: string) => {
    // 将模式中的参数占位符替换为正则表达式中的捕获组
    const regexPattern = pathTemplate.replace(/:(\w+)/g, '([^/]+)');
    // 编译正则表达式，并确保匹配路径的开头
    const regex = new RegExp(`^${regexPattern}$`);
    // 执行匹配
    const match = path.match(regex);

    // 如果匹配成功，则提取参数
    if (match) {
        // 排除模式匹配的第一个结果（完整的匹配）
        const params = match.slice(1);
        // 将参数名称与匹配到的值对应起来
        const paramNames = pathTemplate.match(/:(\w+)/g)?.map((name) => name.slice(1)) || [];
        // 创建结果对象
        const result = {};
        // 填充结果对象
        paramNames.forEach((name, index) => {
            result[name] = params[index];
        });
        return result;
    }

    // 如果没有匹配到，返回空对象
    return {};
};

//保留ancPath的首部/，去掉尾部/
export const formatAncPath = (ancPath: string) => {
    let newAncPath = ancPath.startsWith('/') ? ancPath : '/' + ancPath;
    newAncPath = newAncPath.endsWith('/') ? newAncPath.slice(0, -1) : newAncPath;
    return newAncPath;
};

//根据全体路由配置生成含完整path和name的集合数据
const getPathNameList: (routes: RoutesItemType[]) => Array<{ path: string; name: string }> = (
    routes
) => {
    const list = [];
    const checkRouteItem = (item: RoutesItemType, ancPath: string) => {
        const { path, name, children } = item;
        const newAncPath = `${formatAncPath(ancPath)}${path.startsWith('/') ? path : '/' + path}`;
        list.push({ path: newAncPath, name });
        if (children) {
            children.some((item) => checkRouteItem(item, newAncPath));
        }
    };
    routes.forEach((item) => checkRouteItem(item, ''));
    return list;
};

export const pathNameList = getPathNameList(routes);

const getLocation = (historyLocation): SwicoLocationType => {
    const { pathname, hash, search, state } = historyLocation;
    const routerBaseLength = formatRouterBase.length;
    const path = pathname.slice(routerBaseLength);
    const matchPathNameItem = pathNameList.find(
        (item) => item.path === path || compareURLPatterns(path, item.path)
    );
    // console.log('matchPathNameItem', matchPathNameItem);
    const params = interpolatePathParams(matchPathNameItem?.path, path);
    return {
        state: state ?? {},
        hash,
        search,
        pathname,
        query: search ? qs.parse(search.startsWith('?') ? search.slice(1) : search) : {},
        name: matchPathNameItem?.name,
        params,
        path
    };
};

//格式化处理option
const getFormatHistoryOption = (
    // eslint-disable-next-line no-undef
    to: SwicoHistoryOptionType,
    pathList: ReturnType<typeof getPathNameList>,
    type: 'push' | 'replace'
) => {
    const { params, path, hash, name, query } = to;
    let obj: any = {
        hash,
        search: query ? qs.stringify(query) : undefined
    };
    if (path) {
        //只有path无name时，params需要开发者自行加到path里
        obj.pathname = path;
    }
    if (name) {
        const fullPath = pathList.find((item) => item.name === name)?.path;
        const targetPath = fullPath ? interpolatePath(fullPath, params) : null;
        if (targetPath) {
            obj.pathname = targetPath;
        } else {
            throw `An error occurred while executing 'history.${type}' operation: The path for the name "${name}" could not be found`;
        }
    }
    return obj;
};

export const getHistory = (router) => {
    return {
        go: (delta) => {
            router.navigate(delta);
        },
        forward: () => {
            router.navigate(1);
        },
        back: () => {
            router.navigate(-1);
        },
        push: (to) => {
            switch (typeof to) {
                case 'string':
                    router.navigate(to);
                    break;
                case 'object':
                    // eslint-disable-next-line no-case-declarations
                    const formatOption = getFormatHistoryOption(to, pathNameList, 'push');

                    router.navigate(formatOption, { state: to.state });
                    break;
                default:
                    throw `An error occurred while executing history.push operation: unexpected type of 'to':${typeof to}`;
            }
        },
        replace: (to) => {
            switch (typeof to) {
                case 'string':
                    router.navigate(to, { replace: true });
                    break;
                case 'object':
                    // eslint-disable-next-line no-case-declarations
                    const formatOption = getFormatHistoryOption(to, pathNameList, 'replace');

                    router.navigate(formatOption, { state: to.state, replace: true });
                    break;
                default:
                    throw `An error occurred while executing history.replace operation: unexpected type of 'to':${typeof to}`;
            }
        },
        // @ts-ignore
        get location() {
            return getLocation(router.state.location);
        }
    };
};
export let history: SwicoHistoryType;
