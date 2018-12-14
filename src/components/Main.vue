<template>
<div>
    <div class="navbar denav has-background-grey-light">
        <h2>Description Editor</h2>
        <a href="javascript:void(0)" @click="signout">Signout</a>
    </div>
    <div class="container">
        <div class="columns">
            <div class="column is-8">
                <div class="tab-header columns">
                    <div class="column tabs is-boxed is-10 p0">
                        <ul>
                            <li class="is-active">
                                <a><span>Example1</span></a>
                            </li>
                            <li>
                                <a><span>Example2</span></a>
                            </li>
                        </ul>
                    </div>
                    <div class="column is-2 p0 btn-formalize">
                        <b-icon
                            icon="table-large"
                            size="is-medium">
                        </b-icon>
                        <p>Formalize</p>
                    </div>
                </div>
                <div class="tab-content">
                    <vue-editor v-model="editorContent" ref="editor" spellcheck="false"></vue-editor>
                </div>

                <div class="buttons-wrapper">
                    <div class="left-buttons">
                        <button class="button btn-red">Save as file</button>
                        <button class="button btn-red">Save as template</button>
                        <button class="button btn-blue">Export</button>
                    </div>
                    <div class="right-buttons">
                        <button class="button btn-darkred" v-on:click="check_quality">Check Quality</button>
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
import { mapState, mapMutations, mapActions } from 'vuex';
import { VueEditor } from "vue2-editor";
import Storage from "./Storage";
import ArtBoard  from "./ArtBoard";
import API from '@/network/api';

export default {
    components: {
        VueEditor,
        Storage,
        ArtBoard
    },
    data() {
        return {
            editorContent: "",
            editor: null,
        }
    },
    mounted: function() {
        this.set_user(firebase.auth().currentUser);
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
            'activeTabIndex',
            'replaceArray'
        ]),
    },
    methods: {
        ...mapActions([
            'find_qterms',
            'set_user',
            'insert_resp_body',
            'find_definition',
            'get_tree'
        ]),
        ...mapMutations([
            'ADD_TEXT',
            'CLEAN_TAB_DUST',
            'UPDATE_TEXT',
            'UPDATE_INDEX',
        ]),
        check_quality() {
            const text = this.editor.getText(); // .replace(/(\r\n|\n|\r)/gm,"");
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
                if (q.tabID == this.activeTabIndex) {
                    q.index.forEach(i => {
                        this.editor.formatText(i.pos, i.length, 'underline', true);
                    });
                }
            });
        },
        confirm(qindex) {
            const replaceObj = this.replaceArray.find(r => r.qindex == qindex);
            if (replaceObj !== undefined) {
                let delta = 0;
                if (this.qterms[qindex].index)
                    delta = replaceObj.syn.length - this.qterms[qindex].index[0].length;
                this.qterms[qindex].index.forEach(i => {
                    this.editor.removeFormat(i.pos, i.length);
                    this.editor.deleteText(i.pos, i.length);
                    this.editor.insertText(i.pos, replaceObj.syn);
                });
                this.UPDATE_TEXT({
                    html: this.editorContent,
                    text: this.editor.getText()
                });
                this.qterms.splice(qindex, 1);
                this.UPDATE_INDEX(delta);
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