import React, { CSSProperties, FC, ReactNode } from 'react';
import { SwicoHistoryOptionType, SwicoHistoryType, UseNavType } from '../../typings/global-type';
import { useNav } from './hooks';

interface PropsType {
    replace?: boolean;
    to: string | number | SwicoHistoryOptionType;
    style?: CSSProperties;
    className?: string;
    children: ReactNode;
}

const Link: FC<PropsType> = ({ replace, to, style, className, children }) => {
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

export default Link;
