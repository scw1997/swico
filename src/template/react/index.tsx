import { createRoot } from 'react-dom/client';
import React, { createElement, FC, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from '../layout';
import RouteList from './routes';
import Loading from './loading';
export const basename = '/';

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
    if (basename !== '/' && window.location.pathname === '/') {
        window.location.replace(`${basename}`);
    }
    return (
        <Layout>
            <Router basename={basename}>
                <Routes>{renderChildrenRouteList(RouteList)}</Routes>
            </Router>
        </Layout>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
