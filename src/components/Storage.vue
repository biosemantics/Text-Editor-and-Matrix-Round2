<template>
    <b-tabs type="is-boxed" class="storage-tab">
        <b-tab-item label="Files">
            <div class="saved saved-files">
                <div v-for="f in files" :key="f.id" class="file-wrapper" @click="openFile(f)">
                    <b-icon
                        icon="file-document-outline"
                        size="is-large">
                    </b-icon>
                    <label>{{ f.tabName }}</label>
                </div>
            </div>
        </b-tab-item>
        <b-tab-item label="Table">
            <div class="saved saved-tables">
                <div v-for="t in tables" :key="t.id" class="file-wrapper" @click="openTable(t)">
                    <b-icon
                        icon="file-table-outline"
                        size="is-large">
                    </b-icon>
                    <label>{{ t.tabName }}</label>
                </div>
            </div>
        </b-tab-item>
        <b-tab-item label="Template">
            <div class="saved saved-templates">
                <div v-for="t in templates" :key="t.id" class="file-wrapper" @click="openTemplate(t)">
                    <b-icon
                        icon="file-document-outline"
                        size="is-large">
                    </b-icon>
                    <label>{{ t.tabName + '.t' }}</label>
                </div>
            </div>
        </b-tab-item>
    </b-tabs>
</template>

<script>
import firebase from 'firebase';
import { mapState } from 'vuex';
export default {
    data() {
        return {
            db: null,
            templates: [],
            files: [],
            tables: [],
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
        ]),
    },
    mounted() {
        this.db = firebase.database();
        let app = this;
        const userID = firebase.auth().currentUser.uid;
        this.db.ref("users/" + userID + "/file").once('value', function(snapshot) {
            snapshot.forEach((childSnapshot) => {
                const childData = childSnapshot.val();
                app.files.push({
                    id: childSnapshot.key,
                    ...childData
                });
            });
        });
        this.db.ref("users/" + userID + "/table").once('value', function(snapshot) {
            snapshot.forEach((childSnapshot) => {
                const childData = childSnapshot.val();
                app.tables.push({
                    id: childSnapshot.key,
                    ...childData
                });
            });
        });
        this.db.ref("template").once('value', function(snapshot) {
            snapshot.forEach((childSnapshot) => {
                const childData = childSnapshot.val();
                app.templates.push({
                    id: childSnapshot.key,
                    ...childData
                });
            });
        });
    },
    methods: {
        openTemplate(t) {
            this.$emit('openTemplate', t);
        },
        openTable(t) {
            this.$emit('openTable', t);
        },
        openFile(f) {
            this.$emit('openFile', f);
        }
    }
}
</script>