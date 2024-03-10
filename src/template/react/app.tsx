import { createElement, FC, lazy, Suspense, useEffect, useState } from 'react';
import {BrowserRouter as Router, createBrowserRouter, Route, RouterProvider, Routes} from 'react-router-dom';
import React from 'react'
import  router  from './router';

const App = () => {
    // //递归生成懒加载Route
    // const renderChildrenRouteList: (childrenRoutes: RoutePageType[]) => any = (childrenRoutes) => {
    //     return childrenRoutes?.map((item) => {
    //         const {routes, lazyComponent, element, ...otherProps} = item;
    //
    //         return (
    //             <Route
    //                 {...otherProps}
    //                 element={
    //                     lazyComponent ? (
    //                         <Suspense fallback={'loading'}>
    //                             {createElement(lazy(lazyComponent))}
    //                         </Suspense>
    //                     ) : (
    //                         element
    //                     )
    //                 }
    //                 key={otherProps.path}
    //             >
    //                 {renderChildrenRouteList(routes)}
    //             </Route>
    //         );
    //     });
    // };



    return (
        // <Router>
        //     <Routes>
        //         {renderChildrenRouteList(RouteList)}
        //     </Routes>
        // </Router>
        // @ts-ignore
        <RouterProvider router={router} fallbackElement={<div>111</div>}/>
    );
};

export default App;
