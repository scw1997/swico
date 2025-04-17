import { createRoot } from 'react-dom/client';
import React, { createElement, FC, lazy, ReactNode, Suspense, useLayoutEffect } from 'react';
import {
    createBrowserRouter,
    createHashRouter,
    Navigate,
    Outlet,
    RouterProvider
} from 'react-router';
import Loading from '../loading';
import { getHistory, history } from './history';
import '../../src/global';
import Layout from '../../src/layout';
import routes from './routes';
import { routerBase, routerType } from './config';

class Container extends React.Component<{ children: ReactNode }> {
    state = {
        error: null
    };
    static getDerivedStateFromError(error) {
        return { error: (error as Error).toString() };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        //
    }
    render() {
        return this.state.error ? null : this.props.children;
    }
}

export type RoutesItemType = {
    component?: () => Promise<{ default: FC }>; //页面路径
    children?: RoutesItemType[]; //子路由
    path: string; //路由地址
    redirect?: string; // 重定向路由地址
    name?: string;
    custom?: any;
};

export const getChildrenRouteList = (childrenRoutes: RoutesItemType[], ancPathKey: string) => {
    return childrenRoutes?.map((item) => {
        const { component, path, children, redirect } = item;
        const newAncPathKey = `${ancPathKey}-${path}`;
        return {
            element: redirect ? (
                <Navigate to={redirect} replace />
            ) : component ? (
                <Suspense fallback={<Loading />}>{createElement(lazy(component))}</Suspense>
            ) : (
                <Outlet />
            ),
            key: newAncPathKey,
            path: path.startsWith('/') ? path.slice(1) : path,
            children: getChildrenRouteList(children, newAncPathKey)
        };
    });
};

const App: FC = () => {
    const routeList = [
        {
            element: (
                <Container>
                    <Layout />
                </Container>
            ),
            path: '/',
            children: getChildrenRouteList(routes, '')
        }
    ];
    const router = (routerType === 'hash' ? createHashRouter : createBrowserRouter)(routeList, {
        basename: routerBase
    });
    //处理含basename的情况，自动重定向
    if (routerBase && routerBase !== '/') {
        if (routerType === 'browser' && window.location.pathname === '/') {
            window.location.replace(`${routerBase}`);
        }
    }
    useLayoutEffect(() => {
        // @ts-ignore
        history = getHistory(router);
    });
    return <RouterProvider router={router} />;
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
