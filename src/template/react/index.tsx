import { createRoot } from 'react-dom/client';
import React, { createElement, FC, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RouteList from './router';

export type RoutePageType = {
    component?: () => Promise<FC>;
    routes?: RoutePageType[];
    path: string;
};

const renderChildrenRouteList = (childrenRoutes) => {
    return childrenRoutes?.map((item) => {
        const { component, path, routes } = item;

        return (
            <Route
                element={<Suspense fallback={'loading'}>{createElement(lazy(component))}</Suspense>}
                path={path}
            >
                {renderChildrenRouteList(routes)}
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
