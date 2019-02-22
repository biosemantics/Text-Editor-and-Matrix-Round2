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
            id="table-character"
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
import firebase from 'firebase';
import { mapState, mapMutations, mapActions, mapGetters } from 'vuex';
import JQuery from 'jquery'
let $ = JQuery
export default {
    data: () => ({
        db: null,
        data: [],
        openedDetailed: []
    }),
    mounted() {
        this.data = [];
        this.db = firebase.database();
        if (this.activeTab.hasOwnProperty('data')) {
            this.data = JSON.parse(this.activeTab.data);
        } else {
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
            });
        }
    },
    computed: {
        ...mapState([
            'characters',
            'statements',
            'qterms',
            'user',
            'replaceArray'
        ]),
        ...mapGetters([
            'activeTab',
        ]),
    },
    methods: {
        ...mapActions([
            'get_tables',
        ]),
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
        },
        getTableData() {
            let myTableArray = [];
            $("#table-character table tr").each(function() {
                let arrayOfThisRow = [];
                let tableData = $(this).find('td');
                if (tableData.length > 0) {
                    tableData.each(function() { arrayOfThisRow.push($(this).text().trim()); });
                    myTableArray.push(arrayOfThisRow);
                }
            });
            return myTableArray;            
        },
        getExportData() {
            const app = this;
            let myTableArray = app.getTableData();
            let saveData = [];
            let charaNameFlag = true;
            let wrongCharacterName = "";
            myTableArray.forEach(row => {
                const characterElement = app.data.find(d => d.characterName==row[1]);
                const src = !!characterElement ? characterElement.text : '';
                if (row[1].search(/ (between|of) /)===-1) {
                    charaNameFlag = false;
                    wrongCharacterName = row[1];
                }
                saveData.push({
                    character: row[1],
                    value: row[2],
                    src: src
                });
            });
            if (!charaNameFlag) {
                this.$dialog.alert({
                    title: 'Character Name Error',
                    message: '<b>"' + wrongCharacterName + '"</b> is wrong chracter name. Character name should be consisted of connecting two words with "between" or "of".',
                    type: 'is-danger',
                    hasIcon: false
                });
                return false;
            }
            return saveData;
        },
        saveTable() {
            const app = this;
            const refID = "users/"+this.user.id+"/table";
            const checkURL = refID+"/"+this.activeTab.id;

            let myTableArray = app.getTableData();
            let saveData = [];
            let charaNameFlag = true;
            let wrongCharacterName = "";
            myTableArray.forEach(row => {
                const characterElement = app.data.find(d => d.characterName==row[1]);
                const src = !!characterElement ? characterElement.text : '';
                if (row[1].search(/ (between|of) /)==-1) {
                    charaNameFlag = false;
                    wrongCharacterName = row[1];
                }
                saveData.push({
                    id: saveData.length,
                    characterName: row[1],
                    value: row[2],
                    text: src
                });
            });
            if (!charaNameFlag) {
                this.$dialog.alert({
                    title: 'Character Name Error',
                    message: '<b>"' + wrongCharacterName + '"</b> is wrong chracter name. Character name should be consisted of connecting two words with "between" or "of".',
                    type: 'is-danger',
                    hasIcon: false
                });
                return;
            }

            let data = {
                tabName: this.activeTab.name,
                data: JSON.stringify(saveData)
            };
            this.db.ref(checkURL).once('value', snapshot => {
                if (snapshot.exists()) {
                    this.db.ref(checkURL).update(data);
                } else {
                    this.db.ref(refID).push(data);
                }
                this.get_tables();
            });
        }
    }
}
</script>