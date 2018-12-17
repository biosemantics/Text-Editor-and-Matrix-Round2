import axios from 'axios';
import CONF from '@/config/config.js';

export default {
    search: function(term, parent) {
        return axios.get(CONF.apiUrl + 'carex/search?term='+encodeURI(term)+'&parent='+encodeURI(parent));
    },
    getdef: function(baseIri, term) {
        return axios.get(CONF.apiUrl + 'carex/getDefinition?baseIri=' + baseIri + '&term=' + term.replace(/\s+/g, '-').toLowerCase());
    },
    getTree: function(ontologyKind='carex') {
        return axios.get(CONF.apiUrl + ontologyKind + '/getTree');
    },
    defineTerm: function(reqBody) {
        return axios.post(CONF.apiUrl + 'definition', reqBody);
    }
}