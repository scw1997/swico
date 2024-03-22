import { createRoot } from 'react-dom/client';
import React, { createElement, FC, lazy, Suspense } from 'react';
import { Navigate, Route, Routes, Outlet } from 'react-router-dom';
import Layout from '../layout';
import RouteList from './routes';
import Loading from './loading';
import { HistoryRouter, originalHistory, Navigation } from './history';
import { routerBase, routerType } from './config';

export type RoutesItemType = {
    component?: () => Promise<{ default: FC }>; //页面路径
    children?: RoutesItemType[]; //子路由
    path: string; //路由地址
    redirect?: string; // 重定向路由地址
    name?: string;
};

const renderChildrenRouteList = (childrenRoutes: RoutesItemType[]) => {
    return childrenRoutes?.map((item) => {
        const { component, path, children, redirect } = item;

        return (
            <Route
                element={
                    redirect ? (
                        <Navigate to={redirect} replace />
                    ) : component ? (
                        <Suspense fallback={createElement(Loading)}>
                            {createElement(lazy(component))}
                        </Suspense>
                    ) : (
                        <Outlet />
                    )
                }
                path={path}
                key={path}
            >
                {renderChildrenRouteList(children)}
            </Route>
        );
    });
};

const App = () => {
    //处理含basename的情况，自动重定向
    if (routerBase && routerBase !== '/') {
        if (routerType === 'hash' && ['', '/'].includes(window.location.hash)) {
            window.location.replace(`/#${routerBase}`);
        } else if (routerType === 'browser' && window.location.pathname === '/') {
            window.location.replace(`${routerBase}`);
        }
    }
    //挂载到window上
    window.Navigation = Navigation;
    return (
        // @ts-ignore
        <HistoryRouter basename={routerBase} history={originalHistory}>
            <Layout history={history}>
                <Routes>{renderChildrenRouteList(RouteList)}</Routes>
            </Layout>
        </HistoryRouter>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
