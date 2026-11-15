import { route, render } from './router.js';
import { home } from './views/home.js';
import { routeView } from './views/route.js';
import { discover, feed } from './views/discover.js';
import { budgetView } from './views/budget.js';
import { calendar } from './views/calendar.js';
import { countries } from './views/countries.js';
import { prep } from './views/prep.js';
import { more } from './views/more.js';
import { paintIcons } from './ui.js';

route('home', home);
route('route', routeView);
route('discover', discover);
route('feed', feed);
route('budget', budgetView);
route('calendar', calendar);
route('countries', countries);
route('prep', prep);
route('more', more);

paintIcons(document.querySelector('nav.tabs'));
render();

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
