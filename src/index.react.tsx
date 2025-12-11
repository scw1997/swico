import { GlobalDataType } from './main-config';
import React, { CSSProperties, FC, ReactNode } from 'react';
import { SwicoHistoryOptionType } from './typings/global-type';
import { useLocation, useNav } from './template-root/.swico-react/hooks';
export type CustomConfigType = GlobalDataType['customConfig'];
export type * from './typings/global-type';
export type * from './main-config';

//二次封装link组件，统一只支持部分属性
interface LinkPropsType {
    replace?: boolean;
    to: string | number | SwicoHistoryOptionType;
    style?: CSSProperties;
    className?: string;
    children: ReactNode;
}

export const Link: FC<LinkPropsType> = ({ replace, to, style, className, children }) => {
    const nav = useNav();
    return (
        <a
            onClick={() => {
                // @ts-ignore
                nav(to, { replace });
            }}
            style={style}
            className={className}
        >
            {children}
        </a>
    );
};

export { Outlet } from 'react-router';

export { useLocation, useNav };

export { history } from './mock-history';

//swico 配置
export interface DefineSwicoConfigType {
    (env: 'base', config: CustomConfigType['base']);
    (env: 'dev', config: CustomConfigType['dev']);
    (env: 'prod', config: CustomConfigType['prod']);
}

export const defineConfig: DefineSwicoConfigType = (env, config) => config;

//swico global.ts 配置
export interface DefineGlobalConfigType {
    onInit?: () => void;
}
export const defineGlobal: (config: DefineGlobalConfigType) => DefineGlobalConfigType = (config) =>
    config;
