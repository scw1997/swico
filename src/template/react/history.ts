import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import { routerType, routerBase } from './config';
import { createBrowserHistory, createHashHistory, To } from 'history';
import { ConfigRouterType } from '../../utils/config';

export type HistoryType = {
    push: (to: To, state?: any) => void;
    replace: HistoryType['push'];
    go: (delta: number) => void;
    back: () => void;
    location: Record<string, any>;
    action: string;
};

export const getHistory = (
    routerBase: ConfigRouterType['base'],
    routerType: ConfigRouterType['type']
) => {
    let history: HistoryType;
    const h = (routerType === 'hash' ? createHashHistory : createBrowserHistory)();

    const lastIndexBase = routerBase[routerBase.length - 1];
    //如果Base末尾为/，则忽略
    const formatRouterBase =
        lastIndexBase === '/' ? routerBase.slice(0, routerBase.length - 1) : routerBase;
    console.log('formatRouterBase', formatRouterBase, routerBase);
    console.log('routerType', routerType);
    history = {
        ...h,
        push: (to, state) => {
            console.log('to', to);
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
                    throw `An error occurred while executing history.push operation: unexpected type of 'to':${typeof to}`;
            }
        },
        replace: (to, state) => {
            console.log('to', to);
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
                    throw `An error occurred while executing history.replace operation: unexpected type of 'to':${typeof to}`;
            }
        }
    };

    return history;
};

const history = getHistory(routerBase, routerType);

export { HistoryRouter, history };
