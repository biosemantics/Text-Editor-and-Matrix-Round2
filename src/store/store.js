import Vue from 'vue';
import Vuex from 'vuex';
import { parseOntologyId, findAllIndex, getQType, uniqueID } from '@/helpers/helpers';
import axios from '@/network/axios';

Vue.use(Vuex);

export const store = new Vuex.Store({
	state: {
        user: null,
        activeTabID: 0, 
        activeTabIndex: 0,
        tabs: [
            {
                id:0, 
                name: 'example1', 
                parsed: false, 
                type: 'editor',
                active: true,
                tableOpen: false,
            }
        ],
        texts: [],
        statements: [],
        bios: [],
        characters: [],
        qterms: [],
        ontologyDefArray: [],
        treeData: {},
        replaceArray: [],
    },
    getters: {
        statementByBioID: (state) => bioID => {
            const bio = state.bios.find(b => b.id==bioID);
            if (bio) {
                const statement = state.statements.find(s => s.id ==bio.statementID);
                if (statement) 
                    return statement.text;
            }
            return '';
        },
        bioEntityNameOrigin: (state) => bioID => {
            const bio = state.bios.find(b => b.id == bioID);
            if (bio) {
                return bio.nameOrigin;
            } else
                return '';
        },
        activeTab: (state) => state.tabs[state.activeTabIndex],
    },
    mutations: {
        INIT: (state) => {
            state.activeTabID = 0;
            state.activeTabIndex = 0;
            state.texts = [];
            state.statements = [];
            state.bios = [];
            state.characters = [];
            state.qterms = [];
            state.ontologyDefArray = [];
            state.treeData = {};
            state.replaceArray = [];
        },
        SET_USER: (state, user) => {
            const username = user.email.split('@')[0];
            state.user = {
                id: user.uid,
                name: username,
                email: user.email,
            };
        },
        CLEAN_TAB_DUST: (state) => {
            const tab = state.tabs[state.activeTabIndex];
            if (!!tab.parsed) {
                state.texts = state.texts.filter(t => t.tabID != state.activeTabID);
                state.statements = state.statements.filter(s => s.tabID != state.activeTabID);
                state.bios = state.bios.filter(b => b.tabID != state.activeTabID);
                state.characters = state.characters.filter(c => c.tabID != state.activeTabID);
                state.qterms = state.qterms.filter(q => q.tabID != state.activeTabID);
            }
        }, 
        ADD_TAB: (state, tab) => {
            state.tabs.push(tab);
        },
        SET_TAB_ACTIVE: (state, tabID) => {
            state.tabs.forEach(tab => {
                tab.id == tabID ? tab.active = true : tab.active = false;
            });
            state.activeTabIndex = state.tabs.findIndex(t => t.id == tabID);
            state.activeTabID = tabID;
        },
        ADD_TEXT: (state, {html, text}) => {
            state.texts.push({
                tabID: state.activeTabID,
                html: html,
                text: text
            });
        },
        UPDATE_TEXT_ARRAY: (state, {html, text}) => {
            const t = state.texts.find(t => t.tabID == state.activeTabID);
            t.html = html;
            t.text = text;
        },
        UPDATE_QTERMS_INDEX: (state, {pos, delta}) => {
            state.qterms.forEach(q => {
                q.index.forEach(qi => {
                    if (qi.pos > pos)
                        qi.pos += delta;
                });
            });
        },
        SORT_QTERMS: (state) => {
            state.qterms.sort((q1, q2) => {
                return q1.index[0].pos - q2.index[0].pos;
            });
        },
        UPDATE_TERM: (state, {term, def}) => {
            const od = state.ontologyDefArray.find(o => o.term == term);
            if (od) {
                od.def = def;
            }
        },
        READY_TO_REPLACE(state, replaceObj) {
            let replace = state.replaceArray.find(r => r.qindex==replaceObj.qindex);
            if (replace === undefined) {
                state.replaceArray.push(replaceObj);
            } else {
                replace.term = replaceObj.term;
            }
        },
        RESOLVE_QTERM(state, qindex) {
            state.qterms[qindex].resolved = true;
        },
    }, 
    actions: {
        insert_resp_body: ({state}, resp) => {
            state.tabs[state.activeTabIndex].parsed = true;
            resp.body.statements.forEach(s => {
                // Add statements to the store state
                state.statements.push({
                    id: s.id,
                    tabID: state.activeTabID,
                    text: s.text,
                });

                s.biologicalEntities.forEach(bioVal => {
                    // Add biological entities to the store state
                    if (!!bioVal.nameOriginal) {
                        let bioEntity = {
                            id: bioVal.id,
                            tabID: state.activeTabID,
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
                                    tabID: state.activeTabID,
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
        find_qterms: ({state, commit}) => {
            const text = state.texts.find(t => t.tabID == state.activeTabID).text.toLowerCase();
            state.bios.forEach(bio => {
                const qType = getQType(bio.ontology, bio.notes, bio.id);
                if (qType.length > 0) {
                    qType.forEach(qt => {
                        state.qterms.push({
                            srcType: 'bio',
                            qType: qt,
                            tabID: state.activeTabID,
                            bioID: bio.id,
                            value: bio.nameOrigin, 
                            index: findAllIndex(text, bio.nameOrigin),
                            resolved: false,
                            showReview: false,
                        });
                    });
                }
            });
            state.characters.forEach(c => {
                const qType = getQType(c.ontology, c.notes, c.bioID);
                if (qType.length > 0) {
                    qType.forEach(qt => {
                        const cvalueArray = typeof c.value==="string" ? [c.value] : c.value;
                        cvalueArray.forEach(cv => {
                            state.qterms.push({
                                srcType: 'character',
                                qType: qt,
                                tabID: state.activeTabID,
                                bioID: c.bioID,
                                value: cv,
                                index: findAllIndex(text, cv),
                                resolved: false,
                                showReview: false,
                            });
                        });
                    });
                }
            });
            commit("SORT_QTERMS");
        },
        find_definition: ({state}) => {
            return new Promise((resolve, reject) => {
                let promiseArray = [];
                state.bios.forEach(bio => {
                    if (Array.isArray(bio.ontology) && bio.ontology.length>0) {
                        bio.ontology.forEach(o => {
                            if (o) {
                                // console.log('----->', o.ontologyID.split('#')[0], o.matchingTerm);
                                promiseArray.push(axios.getdef(o.ontologyID.split('#')[0], o.matchingTerm).then(def => {
                                    // console.log(def);
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
                                // console.log('----->', o.ontologyID.split('#')[0], o.matchingTerm);
                                promiseArray.push(axios.getdef(o.ontologyID.split('#')[0], o.matchingTerm).then(def => {
                                    // console.log(def);
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
        open_table: ({state, commit}) => {
            if (!state.tabs[state.activeTabIndex].tableOpen) {
                const newTabID = uniqueID();
                commit("ADD_TAB", {
                    id: newTabID,
                    type: 'table',
                    name: state.tabs[state.activeTabIndex].name+'.tb',
                    originTabID: state.activeTabID,
                    active: true
                });
                state.tabs[state.activeTabIndex].tableOpen = true;
                commit("SET_TAB_ACTIVE", newTabID);
            } else {
                const tableTab = state.tabs.find(t => t.type==="table" && t.originTabID===state.activeTabID);
                commit("SET_TAB_ACTIVE", tableTab.id);
            }
        },
        get_tree: ({state}) => {
            axios.getTree().then(res => {
                state.treeData = res.data;
            });
        },
    }
});