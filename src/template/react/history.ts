import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import { routerType, routerBase } from './config';
import { createBrowserHistory, createHashHistory, To } from 'history';
import { ConfigRouterType } from '../../utils/config';
import routes from './routes';
import { RoutesItemType } from './index';
import qs from 'qs';

export const getPathByName = (targetName: string) => {
    let targetPath;
    const checkRouteItem = (item: RoutesItemType, ancPath: string) => {
        const { path, name, children } = item;
        if (name === targetName) {
            targetPath = `${ancPath}${path}`;
            return true;
        }
        if (children) {
            return children?.some((item) => checkRouteItem(item, `${ancPath}${path}`));
        }
    };
    routes.some((item) => checkRouteItem(item, ''));

    return targetPath;
};

interface HistoryOption {
    path: string;
    name?: string;
    query?: Record<string, any>;
    params?: Record<string, any>;
    hash?: string;
}

export type HistoryType = {
    push: (to: string | HistoryOption, state) => void;
    replace: HistoryType['push'];
    go: (delta: number) => void;
    back: () => void;
    location: Record<string, any>;
    action: string;
};

export const originalHistory = (routerType === 'hash' ? createHashHistory : createBrowserHistory)();

export const getHistory = (routerBase: ConfigRouterType['base']) => {
    let history: HistoryType;

    const lastIndexBase = routerBase[routerBase.length - 1];
    //如果Base末尾为/，则忽略
    const formatRouterBase =
        lastIndexBase === '/' ? routerBase.slice(0, routerBase.length - 1) : routerBase;
    history = {
        ...originalHistory,
        push: (to, state) => {
            switch (typeof to) {
                case 'string':
                    originalHistory.push(`${formatRouterBase}${to}`, state);
                    break;
                case 'object':
                    // eslint-disable-next-line no-case-declarations
                    const { params, path, hash, name, query } = to;
                    // eslint-disable-next-line no-case-declarations
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
                            throw `An error occurred while executing history.push operation: The path for the name "${name}" could not be found`;
                        }
                    }

                    originalHistory.push(obj, state);
                    break;
                default:
                    throw `An error occurred while executing history.push operation: unexpected type of 'to':${typeof to}`;
            }
        },
        replace: (to, state) => {
            switch (typeof to) {
                case 'string':
                    originalHistory.replace(`${formatRouterBase}${to}`, state);
                    break;
                case 'object':
                    // eslint-disable-next-line no-case-declarations
                    const { params, path, hash, name, query } = to;
                    // eslint-disable-next-line no-case-declarations
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
                            throw `An error occurred while executing history.push operation: The path for the name "${name}" could not be found`;
                        }
                    }
                    originalHistory.replace(obj, state);
                    break;
                default:
                    throw `An error occurred while executing history.replace operation: unexpected type of 'to':${typeof to}`;
            }
        }
    };

    return history;
};

const history = getHistory(routerBase);

export { HistoryRouter, history };
