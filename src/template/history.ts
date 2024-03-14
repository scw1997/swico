import { createBrowserHistory, createHashHistory, To } from 'history';
import { RouterType } from '../utils/config';

export type SecywoHistory = {
    push: (to: To, state?: any) => void;
    replace: SecywoHistory['push'];
    go: (delta: number) => void;
    back: () => void;
    location: Record<string, any>;
    action: string;
};

export const getHistory = (routerBase: RouterType['base'], routerType: RouterType['type']) => {
    let history: SecywoHistory;
    const h = (routerType === 'hash' ? createHashHistory : createBrowserHistory)();

    //如果Base末尾为/，则忽略
    const formatRouterBase =
        routerBase[routerBase.length - 1] === '/'
            ? routerBase.slice(0, routerBase.length)
            : routerBase;

    history = {
        push: (to, state) => {
            switch (typeof to) {
                case 'string':
                    h.push(`${formatRouterBase}${to}`, state);
                    break;
                case 'object':
                    // eslint-disable-next-line no-case-declarations
                    const pathname = h.location.pathname;
                    h.push(
                        {
                            ...to,
                            pathname: to.pathname ? `${formatRouterBase}${to.pathname}` : pathname
                        },
                        state
                    );
                    break;
                default:
                    throw '';
            }
        },
        replace: (to, state) => {
            switch (typeof to) {
                case 'string':
                    h.replace(`${formatRouterBase}${to}`, state);
                    break;
                case 'object':
                    // eslint-disable-next-line no-case-declarations
                    const pathname = h.location.pathname;
                    h.replace(
                        {
                            ...to,
                            pathname: to.pathname ? `${formatRouterBase}${to.pathname}` : pathname
                        },
                        state
                    );
                    break;
                default:
                    throw '';
            }
        },
        go: h.go,
        back: h.back,
        location: h.location,
        action: h.action
    };

    return history;
};
