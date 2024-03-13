import { createBrowserHistory, createHashHistory } from 'history';
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import { routerType } from './config';

const history = routerType === 'hash' ? createHashHistory() : createBrowserHistory();

export { HistoryRouter, history };
