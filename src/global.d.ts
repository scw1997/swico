declare type SecywoHistoryOptionType = {
    query?: Record<string, any>;
    params?: Record<string, any>;
    hash?: string;
    path?: string;
    name?: string;
};

declare type SecywoHistoryType = {
    push: (to: string | SecywoHistoryOptionType) => void;
    replace: SecywoHistoryType['push'];
    go: (delta: number) => void;
    back: () => void;
};

declare module '*.vue';

declare interface Window {
    Secywo: {
        history: SecywoHistoryType;
    };
}
