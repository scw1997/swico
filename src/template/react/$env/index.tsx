import { createRoot } from 'react-dom/client';
import React, { createElement, FC, lazy, Suspense } from 'react';
import { Navigate, Route, Routes, Outlet, useParams } from 'react-router-dom';
import routes from './routes';
import Loading from '../loading';
import { HistoryRouter, getHistory } from './history';
import { routerBase, routerType } from './config';
import '../../global';
import Layout from '../../layout';

export type RoutesItemType = {
    component?: () => Promise<{ default: FC }>; //页面路径
    children?: RoutesItemType[]; //子路由
    path: string; //路由地址
    redirect?: string; // 重定向路由地址
    name?: string;
};

const renderChildrenRouteList = (childrenRoutes: RoutesItemType[], ancPathKey: string) => {
    return childrenRoutes?.map((item) => {
        const { component, path, children, redirect } = item;
        const newAncPathKey = `${ancPathKey}-${path}`;
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
                key={newAncPathKey}
                path={path}
            >
                {renderChildrenRouteList(children, newAncPathKey)}
            </Route>
        );
    });
};

const App = () => {
    const { history, originalHistory } = getHistory(routerBase, routerType);
    //处理含basename的情况，自动重定向
    if (routerBase && routerBase !== '/') {
        if (routerType === 'browser' && window.location.pathname === '/') {
            window.location.replace(`${routerBase}`);
        }
    }
    //挂载到window的Swico上
    window.Swico = {
        history
    };
    return (
        // @ts-ignore
        <HistoryRouter basename={routerBase} history={originalHistory}>
            <Routes>
                <Route element={<Layout />} path={''}>
                    {renderChildrenRouteList(routes, '')}
                </Route>
            </Routes>
        </HistoryRouter>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);