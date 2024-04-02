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
    back: () => void;
};

declare module '*.vue';

declare interface Window {
    Swico: {
        history: SwicoHistoryType;
    };
}
