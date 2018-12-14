import CONF from '@/config/config.js';

export default {
    parse: function(app, text) {
        return app.$http.get(CONF.apiUrl + 'parse?description='+encodeURI(text));
    },
    search: function(app, term, parent) {
        return app.$http.get(CONF.apiUrl + 'carex/search?term='+encodeURI(term)+'&parent='+encodeURI(parent));
    },
    loginLog: function(app, user) {
        app.$http
        .get(CONF.backEndAPIUrl+'/activity_log?user_email='+user.email+'&type=8&detail='+user.email)
        .then((response)=>{
            console.log('login log', response);
        });
    }
}