import { createRoot } from 'react-dom/client';
import React, { createElement, FC, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RouteList from './routes';

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
                element={<Suspense fallback={'loading'}>{createElement(lazy(component))}</Suspense>}
                path={path}
            >
                {renderChildrenRouteList(children)}
            </Route>
        );
    });
};
const root = createRoot(document.getElementById('root'));
root.render(
    <Router>
        <Routes>{renderChildrenRouteList(RouteList)}</Routes>
    </Router>
);
