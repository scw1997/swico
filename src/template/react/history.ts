import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import { routerType, routerBase } from './config';
import { createBrowserHistory, createHashHistory, To } from 'history';
import { ConfigRouterType } from '../../utils/config';
import routes from './routes';
import { RoutesItemType } from './index';
import qs from 'qs';

export interface NavigationOptionType {
    path: string;
    name?: string;
    query?: Record<string, any>;
    params?: Record<string, any>;
    hash?: string;
}

export type NavigationType = {
    push: (to: string | NavigationOptionType, state) => void;
    replace: NavigationType['push'];
    go: (delta: number) => void;
    back: () => void;
};

//根据name找到定义路由中的指定path
export const getPathByName = (targetName: string) => {
    let targetPath;
    const checkRouteItem = (item: RoutesItemType, ancPath: string) => {
        const { path, name, children } = item;
        const newAncPath = `${ancPath.startsWith('/') ? ancPath : '/' + ancPath}${path}`;
        if (name === targetName) {
            targetPath = newAncPath;
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
        obj.pathname = `${formatRouterBase}${path}${params ? `/${params}` : ''}`;
    }
    if (name) {
        const targetPath = getPathByName(name);
        if (targetPath) {
            obj.pathname = `${formatRouterBase}${targetPath}${params ? `/${params}` : ''}`;
        } else {
            throw `An error occurred while executing 'Navigation.${type}' operation: The path for the name "${name}" could not be found`;
        }
    }
    return obj;
};

export const originalHistory = (routerType === 'hash' ? createHashHistory : createBrowserHistory)();

export const getNavigation = (routerBase: ConfigRouterType['base']) => {
    let history: NavigationType;

    const lastIndexBase = routerBase[routerBase.length - 1];
    //如果Base末尾为/，则忽略
    const formatRouterBase =
        lastIndexBase === '/' ? routerBase.slice(0, routerBase.length - 1) : routerBase;
    history = {
        go: originalHistory.go,
        back: originalHistory.back,
        push: (to, state) => {
            switch (typeof to) {
                case 'string':
                    originalHistory.push(`${formatRouterBase}${to}`, state);
                    break;
                case 'object':
                    // eslint-disable-next-line no-case-declarations
                    const formatOption = getFormatHistoryOption(to, routerBase, 'push');

                    originalHistory.push(formatOption, state);
                    break;
                default:
                    throw `An error occurred while executing Navigation.push operation: unexpected type of 'to':${typeof to}`;
            }
        },
        replace: (to, state) => {
            switch (typeof to) {
                case 'string':
                    originalHistory.replace(`${formatRouterBase}${to}`, state);
                    break;
                case 'object':
                    // eslint-disable-next-line no-case-declarations
                    const formatOption = getFormatHistoryOption(to, routerBase, 'replace');
                    originalHistory.replace(formatOption, state);
                    break;
                default:
                    throw `An error occurred while executing Navigation.replace operation: unexpected type of 'to':${typeof to}`;
            }
        }
    };

    return history;
};

const Navigation = getNavigation(routerBase);

export { HistoryRouter, Navigation };
