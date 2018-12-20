<template>
<div class="main-wrapper">
    <div class="navbar denav">
        <h2>Description Editor</h2>
        <a href="javascript:void(0)" @click="signout">Signout</a>
    </div>
    <div class="container">
        <div class="columns">
            <div class="column is-8">
                <div class="tab-header columns detab">
                    <div class="column tabs is-boxed is-10 p0">
                        <ul>
                            <li v-for="t in tabs" :key="t.id" v-bind:class="{'is-active': t.active}" @click="toggleTab(t.id)">
                                <a><span contenteditable="true" spellcheck="false">{{ t.name }}</span></a>
                            </li>
                        </ul>
                    </div>
                    <div class="column is-2 p0 btn-formalize" @click="formalize">
                        <b-icon
                            icon="table-large"
                            size="is-medium">
                        </b-icon>
                        <p>Formalize</p>
                    </div>
                </div>
                <div class="tab-content main-de-content">
                    <vue-editor v-model="editorContent" ref="editor" spellcheck="false" v-if="activeTab.type=='editor'"></vue-editor>
                    <de-table ref="detable" v-if="activeTab.type=='table'"></de-table>
                </div>

                <div class="buttons-wrapper">
                    <div class="left-buttons">
                        <button class="button bk-red">Save as file</button>
                        <button class="button bk-red">Save as template</button>
                        <button class="button bk-cyan">Export</button>
                    </div>
                    <div class="right-buttons">
                        <button class="button bk-red" v-on:click="check_quality">Check Quality</button>
                    </div>
                </div>
            </div>
            <div class="column is-4">
                <art-board ref="artBoard" v-on:confirm="confirm"></art-board>
                <storage></storage>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import firebase from 'firebase';
import { mapState, mapMutations, mapActions, mapGetters } from 'vuex';
import { VueEditor } from "vue2-editor";
import Storage from "./Storage";
import ArtBoard  from "./ArtBoard";
import DETable from "./DETable";
import API from '@/network/api';

export default {
    components: {
        VueEditor,
        Storage,
        ArtBoard,
        'de-table': DETable,
    },
    data() {
        return {
            editorContent: "",
            editor: null,
        }
    },
    mounted: function() {
        this.SET_USER(firebase.auth().currentUser);
        this.get_tree();
        this.editor = this.$refs.editor.quill;
        this.editor.on('selection-change', (range, oldRange, source) => {
            if (range) {
                const index = this.qterms.findIndex( q => {
                    let flag = false;
                    q.index.forEach(i => { 
                        if (i.pos <= range.index && range.index < i.pos+i.length) 
                            flag = true; 
                    });
                    return flag;
                });
                if (index >= 0) {
                    this.$refs.artBoard.setScroll(index);
                }
            }
        });
    }, 
    computed: {
        ...mapState([
            'qterms',
            'activeTabID',
            'replaceArray',
            'tabs',
        ]),
        ...mapGetters([
            'activeTab',
        ]),
    },
    methods: {
        ...mapActions([
            'find_qterms',
            'insert_resp_body',
            'find_definition',
            'get_tree',
            'open_table',
        ]),
        ...mapMutations([
            'ADD_TEXT',
            'SET_USER',
            'CLEAN_TAB_DUST',
            'UPDATE_TEXT_ARRAY',
            'UPDATE_QTERMS_INDEX',
            'RESOLVE_QTERM',
            'SET_TAB_ACTIVE',
        ]),
        check_quality() {
            const text = this.editor.getText(); // .replace(/(\r\n|\n|\r)/gm,"");
            if (text.replace(/\s/g, '')==='') {
                return;
            }
            this.CLEAN_TAB_DUST();
            this.ADD_TEXT({
                html: this.editorContent,
                text
            });
            API.parse(this, text).then(resp => {
                console.log(resp);
                this.insert_resp_body(resp).then(() => {
                    this.find_qterms().then(() => {
                        this.find_definition().then(() => {
                            console.log('found quality terms');
                            this.highlight();
                        })
                    });
                });
            });
        },
        highlight() {
            this.qterms.forEach(q => {
                if (q.tabID == this.activeTabID) {
                    q.index.forEach(i => {
                        this.editor.formatText(i.pos, i.length, 'underline', true);
                    });
                }
            });
        },
        formalize() {
            if (this.activeTab.type === 'table') return;
            if (this.activeTab.parsed) {
                this.open_table();
            }
        },
        toggleTab(tabID) {
            this.SET_TAB_ACTIVE(tabID);
        },
        confirm(qindex) {
            const replaceObj = this.replaceArray.find(r => r.qindex == qindex);
            const qterm = this.qterms[qindex];
            if (replaceObj !== undefined && qterm != null) {
                qterm.index.forEach(i => {
                    this.editor.removeFormat(i.pos, i.length);
                    if (qterm.qType.type==='broad' || qterm.qType.type==='not_recommended') {
                        this.editor.deleteText(i.pos, i.length);
                        this.editor.insertText(i.pos, replaceObj.term);
                        this.UPDATE_QTERMS_INDEX({
                            pos: i.pos,
                            delta: replaceObj.term.length - i.length
                        });
                    } else {
                        this.editor.insertText(i.pos, replaceObj.term + ' ');
                        this.UPDATE_QTERMS_INDEX({
                            pos: i.pos,
                            delta: replaceObj.term.length + 1
                        });
                    }
                });
                this.UPDATE_TEXT_ARRAY({
                    html: this.editorContent,
                    text: this.editor.getText()
                });
                this.RESOLVE_QTERM(qindex);
            }
        },
        signout() {
            firebase.auth().signOut().then(() => {
                this.$router.replace('login');
            });
        }
    }
}
</script>