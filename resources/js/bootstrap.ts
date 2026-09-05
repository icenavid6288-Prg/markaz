import axios from 'axios';

// The same entry is evaluated by Vite's SSR warm-up; browser globals are unavailable there.
if (typeof window !== 'undefined') {
    window.axios = axios;
    window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
}
