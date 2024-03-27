import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import { routerType, routerBase } from './config';
import { ConfigRouterType } from '../../utils/config';
import routes from './routes';
import { RoutesItemType } from './index';
import qs from 'qs';
import { createBrowserHistory, createHashHistory } from 'history';

export type NavigationOptionType = {
    query?: Record<string, any>;
    params?: Record<string, any>;
    hash?: string;
    path?: string;
    name?: string;
};

export type NavigationType = {
    push: (to: string | NavigationOptionType) => void;
    replace: NavigationType['push'];
    go: (delta: number) => void;
    back: () => void;
};

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

//根据name找到定义路由中的指定path
const getPathByName = (targetName: string, params: Record<string, any> = {}) => {
    let targetPath;
    const checkRouteItem = (item: RoutesItemType, ancPath: string) => {
        const { path, name, children } = item;
        const newAncPath = `${ancPath.startsWith('/') ? ancPath : '/' + ancPath}${path.startsWith('/') ? path.slice(1) : path}`;
        if (name === targetName) {
            targetPath = interpolatePath(newAncPath, params);
            return true;
        }
        if (children) {
            return children?.some((item) => checkRouteItem(item, newAncPath));
        }
    };
    routes.some((item) => checkRouteItem(item, ''));
    console.log('targetPath', targetName, targetPath);
    return targetPath;
};

//格式化处理option
const getFormatHistoryOption = (
    to: NavigationOptionType,
    formatRouterBase,
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
        const targetPath = getPathByName(name, params);
        if (targetPath) {
            obj.pathname = `${formatRouterBase}${targetPath}`;
        } else {
            throw `An error occurred while executing 'Navigation.${type}' operation: The path for the name "${name}" could not be found`;
        }
    }
    return obj;
};

const originalHistory = (routerType === 'hash' ? createHashHistory : createBrowserHistory)?.();

export const getHistory = (routerBase: ConfigRouterType['base']) => {
    let history: NavigationType;

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
                    const formatOption = getFormatHistoryOption(to, routerBase, 'push');

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
                    const formatOption = getFormatHistoryOption(to, routerBase, 'replace');
                    originalHistory.replace(formatOption);
                    break;
                default:
                    throw `An error occurred while executing Navigation.replace operation: unexpected type of 'to':${typeof to}`;
            }
        }
    };

    return history;
};

const history = getHistory(routerBase);

export { HistoryRouter, originalHistory, history };
