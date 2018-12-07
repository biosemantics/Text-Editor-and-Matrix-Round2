import CONF from '@/config/config.js';

export default {
    parse: function(app, text) {
        return app.$http.get(CONF.apiUrl+'parse?description='+encodeURI(text));
    }
}