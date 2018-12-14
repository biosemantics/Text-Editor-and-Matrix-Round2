import Vue from 'vue';
import Vuex from 'vuex';
import {parseOntologyId, findAllIndex, getQType} from '@/helpers/helpers';
import axios from '@/network/axios';

Vue.use(Vuex);

export const store = new Vuex.Store({
	state: {
        user: null,
        activeTabIndex: 0, 
        tabs: [{ id:0, name: 'example1', parsed: false}],
        texts: [],
        statements: [],
        bios: [],
        characters: [],
        qterms: [],
        ontologyDefArray: [],
        treeData: {},
        replaceArray: [],
    },
    mutations: {
        SET_USER: (state, user) => {
            const username = user.email.split('@')[0];
            state.user = {
                id: user.uid,
                name: username,
                email: user.email,
            };
        },
        CLEAN_TAB_DUST: (state) => {
            const tab = state.tabs.find(t => t.id == state.activeTabIndex);
            if (!!tab.parsed) {
                state.texts = state.texts.filter(t => t.tabID != state.activeTabIndex);
                state.statements = state.statements.filter(s => s.tabID != state.activeTabIndex);
                state.bios = state.bios.filter(b => b.tabID != state.activeTabIndex);
                state.characters = state.characters.filter(c => c.tabID != state.activeTabIndex);
                state.qterms = state.qterms.filter(q => q.tabID != state.activeTabIndex);
            }
        }, 
        ADD_TEXT: (state, {html, text}) => {
            state.texts.push({
                tabID: state.activeTabIndex,
                html: html,
                text: text
            });
        },
        UPDATE_TEXT: (state, {html, text}) => {
            const t = state.texts.find(t => t.tabID == state.activeTabIndex);
            t.html = html;
            t.text = text;
        },
        UPDATE_INDEX: (state, delta) => {
            state.qterms.forEach(q => {
                q.index.forEach(qi => {
                    qi.pos += delta;
                });
            });
        }
    }, 
    actions: {
        insert_resp_body: ({state}, resp) => {
            state.tabs.find(t => t.id == state.activeTabIndex).parsed = true;
            resp.body.statements.forEach(s => {
                // Add statements to the store state
                state.statements.push({
                    id: s.id,
                    tabID: state.activeTabIndex,
                    text: s.text,
                });

                s.biologicalEntities.forEach(bioVal => {
                    // Add biological entities to the store state
                    if (!!bioVal.nameOriginal) {
                        let bioEntity = {
                            id: bioVal.id,
                            tabID: state.activeTabIndex,
                            statementID: s.id,
                            src: bioVal.src,
                            type: bioVal.type,
                            name: bioVal.name,
                            nameOrigin: bioVal.nameOriginal,
                            notes: bioVal.notes,
                            ontology: null
                        };
                        if(bioVal.hasOwnProperty('ontologyId') && !!bioVal.ontologyId) {
                            bioEntity.ontology = parseOntologyId(bioVal.ontologyId);
                        }
                        state.bios.push(bioEntity);
                    }
                    //Add characters to the store state
                    if(bioVal.hasOwnProperty('characters')) {
                        bioVal.characters.forEach(character => {
                            if (!/\d/.test(character.value)) {
                                const item_string = character.name + " of " + bioVal.name;
                                const characterValue = character.value.search(/\s?[;|\|]\s?/) < 0 ? character.value : character.value.split(/\s?[;|\|]\s?/);
                                let characterEntity = {
                                    bioID: bioVal.id,
                                    tabID: state.activeTabIndex,
                                    displayName: item_string, 
                                    name: character.name,
                                    src: character.src,
                                    value: characterValue,
                                    notes: character.notes,
                                    ontology: null
                                };
                                if(character.hasOwnProperty('ontologyId') && !!character.ontologyId) {
                                    characterEntity.ontology = parseOntologyId(character.ontologyId);
                                }
                                state.characters.push(characterEntity);
                            }
                        });
                    }
                });
            });
        },
        find_qterms: ({state}) => {
            const text = state.texts.find(t => t.tabID == state.activeTabIndex).text.toLowerCase();
            state.bios.forEach(bio => {
                const qType = getQType(bio.ontology, bio.notes);
                if (qType.length > 0) {
                    qType.forEach(qt => {
                        state.qterms.push({
                            srcType: 'bio',
                            qType: qt,
                            tabID: state.activeTabIndex,
                            bioID: bio.id,
                            value: bio.nameOrigin, 
                            index: findAllIndex(text, bio.nameOrigin)
                        });
                    });
                }
            });
            state.characters.forEach(c => {
                const qType = getQType(c.ontology, c.notes);
                if (qType.length > 0) {
                    qType.forEach(qt => {
                        const cvalueArray = typeof c.value==="string" ? [c.value] : c.value;
                        cvalueArray.forEach(cv => {
                            state.qterms.push({
                                srcType: 'character',
                                qType: qt,
                                tabID: state.activeTabIndex,
                                bioID: c.bioID,
                                value: cv,
                                index: findAllIndex(text, cv)
                            });
                        });
                    });
                }
            });
        },
        find_definition: ({state}) => {
            return new Promise((resolve, reject) => {
                let promiseArray = [];
                state.bios.forEach(bio => {
                    if (Array.isArray(bio.ontology) && bio.ontology.length>0) {
                        bio.ontology.forEach(o => {
                            if (o) {
                                promiseArray.push(axios.getdef(o.ontologyID.split('#')[0], o.matchingTerm).then(def => {
                                    state.ontologyDefArray.push({
                                        term: o.matchingTerm,
                                        def: def.data
                                    });
                                }));
                            }
                        });
                    }
                });
                state.characters.forEach(c => {
                    if (Array.isArray(c.ontology) && c.ontology.length>0) {
                        c.ontology.forEach(o => {
                            if (o) {
                                promiseArray.push(axios.getdef(o.ontologyID.split('#')[0], o.matchingTerm).then(def => {
                                    state.ontologyDefArray.push({
                                        term: o.matchingTerm,
                                        def: def.data
                                    });
                                }));
                            }
                        });
                    }
                });
                Promise.all(promiseArray).then(() => {
                    resolve();
                })
            });
        },
        get_tree: ({state}) => {
            axios.getTree().then(res => {
                state.treeData = res.data;
            });
        },
        set_user: ({commit}, user) => {
            commit("SET_USER", user);
        },
        set_replace_array({state}, replaceObj) {
            let replace = state.replaceArray.find(r => r.qindex==replaceObj.qindex);
            if (replace === undefined) {
                state.replaceArray.push(replaceObj);
            } else {
                replace.syn = replaceObj.syn;
            }
        }
    }
});