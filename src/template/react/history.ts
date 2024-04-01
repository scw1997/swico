import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import { routerType, routerBase } from './config';
import { ConfigRouterType } from '../../utils/config';
import routes from './routes';
import { RoutesItemType } from './index';
import qs from 'qs';
import { createBrowserHistory, createHashHistory } from 'history';

//处理params参数，将路径模板中的参数部分替换为对应的值
const interpolatePath = (pathTemplate: string, params: Record<string, any>) => {
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

//保留ancPath的首部/，去掉尾部/
export const formatAncPath = (ancPath: string) => {
    let newAncPath = ancPath.startsWith('/') ? ancPath : '/' + ancPath;
    newAncPath = newAncPath.endsWith('/') ? newAncPath.slice(0, -1) : newAncPath;
    return newAncPath;
};

//根据全体路由配置生成含完整path和name的集合数据
const getPathNameList: () => Array<{ path: string; name: string }> = () => {
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

export const pathNameList = getPathNameList();

//格式化处理option
const getFormatHistoryOption = (
    // eslint-disable-next-line no-undef
    to: SecywoHistoryOptionType,
    formatRouterBase,
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
        obj.pathname = `${formatRouterBase}${path}`;
    }
    if (name) {
        const fullPath = pathList.find((item) => item.name === name)?.path;
        const targetPath = fullPath ? interpolatePath(fullPath, params) : null;
        if (targetPath) {
            obj.pathname = `${formatRouterBase}${targetPath}`;
        } else {
            throw `An error occurred while executing 'Navigation.${type}' operation: The path for the name "${name}" could not be found`;
        }
    }
    return obj;
};

export const getHistory = (routerBase: ConfigRouterType['base']) => {
    // eslint-disable-next-line no-undef
    let history: SecywoHistoryType;
    const originalHistory = (routerType === 'hash' ? createHashHistory : createBrowserHistory)?.();
    const lastIndexBase = routerBase[routerBase.length - 1];
    //如果Base末尾为/，则忽略
    const formatRouterBase =
        lastIndexBase === '/' ? routerBase.slice(0, routerBase.length - 1) : routerBase;
    history = {
        go: originalHistory.go,
        back: originalHistory.back,
        push: (to) => {
            switch (typeof to) {
                case 'string':
                    originalHistory.push(`${formatRouterBase}${to}`);
                    break;
                case 'object':
                    // eslint-disable-next-line no-case-declarations
                    const formatOption = getFormatHistoryOption(
                        to,
                        formatRouterBase,
                        pathNameList,
                        'push'
                    );

                    originalHistory.push(formatOption);
                    break;
                default:
                    throw `An error occurred while executing Navigation.push operation: unexpected type of 'to':${typeof to}`;
            }
        },
        replace: (to) => {
            switch (typeof to) {
                case 'string':
                    originalHistory.replace(`${formatRouterBase}${to}`);
                    break;
                case 'object':
                    // eslint-disable-next-line no-case-declarations
                    const formatOption = getFormatHistoryOption(
                        to,
                        formatRouterBase,
                        pathNameList,
                        'replace'
                    );
                    originalHistory.replace(formatOption);
                    break;
                default:
                    throw `An error occurred while executing Navigation.replace operation: unexpected type of 'to':${typeof to}`;
            }
        }
    };

    return { history, originalHistory };
};

const historyData = getHistory(routerBase);

export { HistoryRouter, historyData };
