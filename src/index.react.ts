import { GlobalData, GlobalConfigType } from './utils/config';
import { Link as RouterLink } from 'react-router-dom';
import React, { CSSProperties, FC, ReactNode } from 'react';

export type CustomConfigType = GlobalData['customConfig'];

export type { GlobalConfigType };

//二次封装link组件，统一只支持部分属性
export const Link: FC<{
    replace?: boolean;
    to: string;
    style?: CSSProperties;
    className?: string;
    children: ReactNode;
}> = ({ replace, to, style, className, children }) =>
    React.createElement(RouterLink, { replace, to, style, className }, children);

export { Outlet } from 'react-router-dom';

export { useLocation } from './template/hooks/react';

//secywo 配置
export interface DefineConfigType {
    (env: 'base', config: CustomConfigType['base']);
    (env: 'dev', config: CustomConfigType['dev']);
    (env: 'prod', config: CustomConfigType['prod']);
}

export const defineConfig: DefineConfigType = (env, config) => config;
