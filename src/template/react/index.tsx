import { createRoot } from 'react-dom/client';
import React, { createElement, FC, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from '../layout';
import RouteList from './routes';
import Loading from './loading';
import { HistoryRouter, history } from './history';
import { routerBase, routerType } from './config';

export default history;

export type RoutePageType = {
    component?: () => Promise<{ default: FC }>;
    children?: RoutePageType[];
    path: string;
};

const renderChildrenRouteList = (childrenRoutes: RoutePageType[]) => {
    return childrenRoutes?.map((item) => {
        const { component, path, children } = item;

        return (
            <Route
                element={
                    <Suspense fallback={createElement(Loading)}>
                        {createElement(lazy(component))}
                    </Suspense>
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
    if (routerBase && routerBase !== '/') {
        if (
            routerType === 'hash' &&
            window.location.pathname === '/' &&
            window.location.hash === ''
        ) {
            window.location.replace(`${routerBase}#/`);
        } else if (routerType === 'browser' && window.location.pathname === '/') {
            window.location.replace(`${routerBase}`);
        }
    }
    return (
        // @ts-ignore
        <HistoryRouter basename={routerBase} history={history}>
            <Layout>
                <Routes>{renderChildrenRouteList(RouteList)}</Routes>
            </Layout>
        </HistoryRouter>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
