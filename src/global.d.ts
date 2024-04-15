declare type SwicoLocationType = {
    name: string; //路由唯一标识
    path: string; //路由path值
    pathname: string; //带basename的路由path值
    search: string;
    query?: Record<string, any>;
    hash: string;
    params?: Record<string, any>;
};

declare type SwicoHistoryOptionType = {
    query?: Record<string, any>;
    params?: Record<string, any>;
    hash?: string;
    path?: string;
    name?: string;
};

declare type SwicoHistoryType = {
    push: (to: string | SwicoHistoryOptionType) => void;
    replace: SwicoHistoryType['push'];
    go: (delta: number) => void;
    forward: () => void;
    back: () => void;
    location: SwicoLocationType;
};

declare module '*.vue';

declare interface Window {
    Swico: {
        history: SwicoHistoryType;
    };
}

declare type UseLocationType = {
    (): {
        name: string; //路由唯一标识
        path: string; //路由path值
        pathname: string; //带basename的路由path值
        search: string;
        query?: Record<string, any>;
        hash: string;
        params?: Record<string, any>;
    };
};
