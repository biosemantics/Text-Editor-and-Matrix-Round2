import Vue from 'vue';
import Vuex from 'vuex';
import {parseOntologyId} from '@/helpers/helpers';

Vue.use(Vuex);

export const store = new Vuex.Store({
	state: {
        activeTabIndex: 0, 
        tabs: [{ id:0, name: 'example1', parsed: false}],
        texts: [],
        statements: [],
        bios: [],
        characters: []
    },
    mutations: {
        CLEAN_TAB_DUST: (state) => {
            const tab = state.tabs.find(t => t.id == state.activeTabIndex);
            if (!!tab.parsed) {
                state.texts = state.texts.filter(t => t.tabID != state.activeTabIndex);
                state.statements = state.statements.filter(s => s.tabID != state.activeTabIndex);
                state.bios = state.bios.filter(b => b.tabID != state.activeTabIndex);
                state.characters = state.characters.filter(c => c.tabID != state.activeTabIndex);
            }
        }, 
        ADD_TEXT: (state, {html, text}) => {
            state.texts.push({
                tabID: state.activeTabIndex,
                html: html,
                text: text
            });
        }, 
        INSERT_RESP_BODY: (state, resp) => {
            state.tabs.find(t => t.id == state.activeTabIndex).parsed = true;
            resp.body.statements.forEach(s => {
                // Add statements to the store state
                state.statements.push({
                    id: s.id,
                    tab_id: state.activeTabIndex
                });

                s.biologicalEntities.forEach(bioVal => {
                    // Add biological entities to the store state
                    if (!!bioVal.nameOriginal) {
                        let ontology = null;
                        if(bioVal.hasOwnProperty('ontologyId') && !!bioVal.ontologyId) {
                            ontology = parseOntologyId(bioVal.ontologyId);
                        }
                        state.bios.push({
                            id: bioVal.id,
                            tab_id: state.activeTabIndex,
                            statement_id: s.id,
                            src: bioVal.src,
                            type: bioVal.type,
                            name: bioVal.name,
                            nameOrigin: bioVal.nameOriginal,
                            ontology: ontology
                        });
                    }
                    //Add characters to the store state
                    if(bioVal.hasOwnProperty('characters')) {
                        bioVal.characters.forEach(character => {
                            const item_string = character.name + " of " + bioVal.name;
                            let ontology = null;
                            if(character.hasOwnProperty('ontologyId') && !!character.ontologyId) {
                                ontology = parseOntologyId(character.ontologyId);
                            }
                            state.characters.push({
                                bio_id: bioVal.id,
                                tab_id: state.activeTabIndex,
                                displayName: item_string, 
                                name: character.name,
                                src: character.src,
                                value: character.value,
                                notes: character.notes,
                                ontology: ontology
                            });
                        });
                    }
                });
            });
        }
    }, 
    actions: {
        add_text: (context, text_object) => {
            context.commit("ADD_TEXT", text_object);
        }, 
        insert_resp_body: (context, resp) => {
            context.commit("INSERT_RESP_BODY", resp);
        }
    }
});