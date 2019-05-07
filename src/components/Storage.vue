<template>
    <b-tabs type="is-boxed" class="storage-tab">
        <b-tab-item label="Files">
            <div class="saved saved-files">
                <div v-for="f in files" :key="f.id" class="file-wrapper" @click="openFile(f)" @contextmenu.prevent="$refs.fileMenu.open($event, f)">
                    <b-icon
                        icon="file-document-outline"
                        size="is-large">
                    </b-icon>
                    <label>{{ f.tabName }}</label>
                </div>
                <vue-context ref="fileMenu">
                    <ul slot-scope="child" class="context-ul">
                        <li @click="onRemoveFile($event.target.innerText, child.data)">Remove</li>
                    </ul>
                </vue-context>
            </div>
        </b-tab-item>
        <b-tab-item label="Table">
            <div class="saved saved-tables">
                <div v-for="t in tables" :key="t.id" class="file-wrapper" @click="openTable(t)" @contextmenu.prevent="$refs.tableMenu.open($event, t)">
                    <b-icon
                        icon="file-table-outline"
                        size="is-large">
                    </b-icon>
                    <label>{{ t.tabName }}</label>
                </div>
                <vue-context ref="tableMenu">
                    <ul slot-scope="child" class="context-ul">
                        <li @click="onRemoveTable($event.target.innerText, child.data)">Remove</li>
                    </ul>
                </vue-context>
            </div>
        </b-tab-item>
        <b-tab-item label="Template">
            <div class="saved saved-templates">
                <div v-for="t in templates" :key="t.id" class="file-wrapper" @click="openTemplate(t)" @contextmenu.prevent="$refs.templateMenu.open($event, t)">
                    <b-icon
                        icon="file-document-outline"
                        size="is-large">
                    </b-icon>
                    <label>{{ t.tabName + '.t' }}</label>
                </div>
                <vue-context ref="templateMenu">
                    <ul slot-scope="child" class="context-ul">
                        <li @click="onRemoveTemplate($event.target.innerText, child.data)">Remove</li>
                    </ul>
                </vue-context>
            </div>
        </b-tab-item>
    </b-tabs>
</template>

<script>
import { mapState, mapActions} from 'vuex';

import Vue from 'vue';
import { VueContext } from 'vue-context';

import firebase from 'firebase';

export default {
    data() {
        return {
        }
    },
    computed: {
        ...mapState([
            'qterms',
            'activeTabID',
            'activeTabIndex',
            'replaceArray',
            'tabs',
            'user',
            'templates',
            'files',
            'tables'
        ]),
    },
    components: {
        VueContext
    },
    mounted() {
        this.get_files();
        this.get_tables();
        this.get_templates();
    },
    methods: {
        ...mapActions([
            'get_files',
            'get_tables',
            'get_templates'
        ]),
        openTemplate(t) {
            this.$emit('openTemplate', t, 'template');
        },
        openTable(t) {
            this.$emit('openTable', t);
        },
        openFile(f) {
            this.$emit('openFile', f, 'file');
        },
        openMenu(t) {
            var app = this;
            console.log(t);
        },
        onRemoveFile (event, data) {
            const db = firebase.database();
            const userID = firebase.auth().currentUser.uid;
            var currentFile = db.ref("users/" + userID + "/file/" + data.id);
            currentFile.remove();
            this.get_files();
        },
        onRemoveTable (event, data) {
            const db = firebase.database();
            const userID = firebase.auth().currentUser.uid;
            var currentTable = db.ref("users/" + userID + "/table/" + data.id);
            currentTable.remove();
            this.get_tables();
        },
        onRemoveTemplate (event, data) {
            const db = firebase.database();
            var currentTemplate = db.ref('template/' + data.id);
            currentTemplate.remove();
            this.get_templates();
        },
    }
}
</script>