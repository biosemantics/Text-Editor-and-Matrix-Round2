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
import { mapState, mapActions} from 'vuex';
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
        }
    }
}
</script>