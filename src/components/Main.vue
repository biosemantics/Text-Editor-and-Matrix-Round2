<template>
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
            <art-board></art-board>
            <storage></storage>
        </div>
    </div>
</div>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex';
import { VueEditor } from "vue2-editor";
import Storage from "./Storage";
import ArtBoard  from "./ArtBoard";
import API from '@/network/index';

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
        this.editor = this.$refs.editor.quill;
    }, 
    methods: {
        ...mapActions([
            'insert_resp_body', 
            'add_text'
        ]),
        ...mapMutations([
            'CLEAN_TAB_DUST'
        ]),
        check_quality() {
            const text = this.editor.getText().replace(/(\r\n|\n|\r)/gm,"");
            this.add_text({
                html: this.editorContent,
                text
            });
            this.CLEAN_TAB_DUST();
            API.parse(this, text).then(resp => {
                console.log(resp);
                this.insert_resp_body(resp);
            });
        }
    }
}
</script>