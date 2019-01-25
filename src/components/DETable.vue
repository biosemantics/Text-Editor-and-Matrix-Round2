<template>
    <section class="section-table">
        <b-table
            :data="data"
            :bordered="true"
            :striped="true"
            :hoverable="true"
            :opened-detailed="openedDetailed"
            detailed
            detail-key="id"
            spellcheck="false"
        >

            <template slot-scope="props" slot="header">
                {{ props.column.label }} 
                <b-icon
                    icon="plus-circle-outline"
                    size="is-small"
                    v-if="props.index===0"
                    @click.native="addRow">
                </b-icon>
            </template>

            <template slot-scope="props">
                <b-table-column field="displayName" label="Character" contenteditable="true" width="270">
                    {{ props.row.characterName }}
                </b-table-column>

                <b-table-column field="value" label="Value" contenteditable="true">
                    {{ props.row.value }}
                </b-table-column>

                <b-table-column class="col-controls" width="50">
                    <!-- <b-icon
                        :icon="openedDetailed.indexOf(props.index)<0 ? 'arrow-down-drop-circle' : 'arrow-up-drop-circle'"
                        size="is-small"
                        @click.native="openDetail(props.index)">
                    </b-icon> -->
                    <b-icon
                        icon="trash-can-outline"
                        size="is-small"
                        @click.native="deleteRow(props.index)">
                    </b-icon>
                </b-table-column>
            </template>

            <template slot="detail" slot-scope="props">
                <div class="content">
                    <p>
                        {{ props.row.text }}
                    </p>
                </div>
            </template>

            <template slot="empty">
                <section class="section">
                    <div class="content has-text-grey has-text-centered">
                        <p>
                            <b-icon
                                icon="emoticon-sad"
                                size="is-large">
                            </b-icon>
                        </p>
                        <p>Nothing here.</p>
                    </div>
                </section>
            </template>
        </b-table>
    </section>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex';
export default {
    data: () => ({
        data: [],
        openedDetailed: []
    }),
    mounted() {
        this.data = [];
        this.characters.forEach(c => {
            let characterValue = c.value;
            let src = this.statements.find(s => s.id == c.src).text;
            const qi = this.qterms.findIndex(q => q.srcType=="character" && q.value==c.value);
            if (qi>-1 && this.qterms[qi].resolved) {
                const replaced = this.replaceArray.find(r => r.qindex==qi);
                if (replaced !== undefined) {
                    characterValue = replaced.term;
                    src = src.replace(c.value, characterValue);
                }
            }
            this.data.push({
                id: this.data.length,
                characterName: c.displayName,
                value: characterValue,
                text: src
            });
        })
    },
    computed: {
        ...mapState([
            'characters',
            'statements',
            'qterms',
            'replaceArray'
        ]),
    },
    methods: {
        addRow() {
            this.data.push({
                characterName: '',
                value: '',
                text: ''
            });
        },
        deleteRow(index) {
            this.data.splice(index, 1);
        },
        openDetail(index) {
            if (this.openedDetailed.indexOf(index) < 0 )
                this.openedDetailed.push(index);
            else {
                this.openedDetailed.splice(this.openedDetailed.indexOf(index), 1);
            }
        }
    }
}
</script>