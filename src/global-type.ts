export type SwicoLocationType = {
    name: string; //路由唯一标识
    path: string; //路由path值
    pathname: string; //带basename的路由path值
    search: string;
    query?: Record<string, any>;
    hash: string;
    params?: Record<string, any>;
};

export type SwicoHistoryOptionType = {
    query?: Record<string, any>;
    params?: Record<string, any>;
    hash?: string;
    path?: string;
    name?: string;
};

export type SwicoHistoryType = {
    push: (to: string | SwicoHistoryOptionType) => void;
    replace: SwicoHistoryType['push'];
    go: (delta: number) => void;
    forward: () => void;
    back: () => void;
    location: SwicoLocationType;
};

export type UseLocationType = {
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
