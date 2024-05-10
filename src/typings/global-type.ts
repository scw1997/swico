export type SwicoLocationType = {
    query?: Record<string, any>;
    params?: Record<string, any>;
    hash: string;
    name: string; //路由唯一标识
    path: string; //路由path值
    pathname: string; //带basename的路由path值
    search: string;
    state?: Record<string, any>;
};

export type SwicoHistoryOptionType = {
    query?: Record<string, any>;
    params?: Record<string, any>;
    hash?: string;
    path?: string;
    name?: string;
    state?: Record<string, any>;
};

export type SwicoHistoryType = {
    push: (to: string | SwicoHistoryOptionType) => void;
    replace: SwicoHistoryType['push'];
    go: (delta: number) => void;
    forward: () => void;
    back: () => void;
    location: SwicoLocationType;
};

export type UseLocationType = () => SwicoLocationType;

export type NavOptionsType = {
    replace: boolean;
};

export type UseNavType = () => {
    (to: string, options?: NavOptionsType): void;
    (to: number): void;
    (to: SwicoHistoryOptionType, options?: NavOptionsType): void;
};
