<template>
<div class="main-wrapper">
    <div class="navbar denav">
        <h2>Description Editor</h2>
        <div>
            <label>{{ (user ? user.name : '')+' |' }}</label>
            <a href="javascript:void(0)" @click="signout">Signout</a>
        </div>
    </div>
    <div class="container">
        <div class="columns">
            <div class="column is-8">
                <div class="tab-header columns detab">
                    <div class="column tabs is-boxed is-10 p0">
                        <ul class="nav nav-tabs">
                            <li v-for="t in tabs" :key="t.id" v-bind:class="{'is-active': t.active}" @click="toggleTab($event, t.id)">
                                <a class="nav-link">
                                    <span v-if="t.id == 0">
                                        {{ t.name }}
                                    </span>
                                    <span contenteditable="true"
                                          v-if="t.id != 0"
                                        :id="'tab_'+t.id"
                                        spellcheck="false"
                                        v-on:blur="tabNameChanged(t)"
                                        onkeypress="javascript: return event.which != 13;">
                                        {{ t.name }}
                                    </span>
                                    &nbsp;&nbsp;&nbsp;<span @click="closeTab(t.id)">x</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div class="column is-2 p0 btn-formalize" @click="formalize">
                        <b-icon
                            icon="table-large"
                            size="is-medium">
                        </b-icon>
                        <p>Matricize</p>
                    </div>
                </div>
                <div class="tab-content main-de-content">
                    <vue-editor 
                        v-model="editorContent" 
                        ref="editor" 
                        spellcheck="false" 
                        v-show="activeTab.type=='editor'"
                        :disabled="activeTab.isEditable===false"
                        >
                    </vue-editor>
                    <de-table ref="detable" v-if="activeTab.type=='table'"></de-table>
                </div>

                <div class="buttons-wrapper" v-bind:class="{'flex-row-reverse': activeTab.isEditable===false}">
                    <div class="left-buttons" v-if="activeTab.isEditable!==false">
                        <button class="button bk-red" @click="onSave(1)">{{ activeTab.type=='editor' ? 'Save as file' : 'Save Table' }}</button>
                        <button class="button bk-red" v-show="activeTab.type=='editor'" @click="onSave(2)">Save as template</button>
                        <button class="button bk-cyan" @click="onExport">Export</button>
                    </div>
                    <div class="right-buttons" v-if="activeTab.type!=='table'">
                        <button class="button bk-red" v-on:click="check_quality" v-if="activeTab.isEditable!==false">Check Quality</button>
                        <button class="button bk-cyan btn-clone" @click="clone" v-if="activeTab.isEditable===false">Clone</button>
                    </div>
                </div>
            </div>
            <div class="column is-4">
                <art-board 
                    ref="artBoard" 
                    v-on:confirm="confirm"
                    v-on:added="added">
                </art-board>
                <storage
                    v-on:openTemplate="openFile"
                    v-on:openFile="openFile"
                    v-on:openTable="openTable">
                </storage>
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
import { uniqueID } from '@/helpers/helpers';
import XLSX from 'xlsx';

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
            db: null,
        }
    },
    mounted: function() {
        this.db = firebase.database();
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
            'bios',
            'activeTabID',
            'activeTabIndex',
            'replaceArray',
            'tabs',
            'texts',
            'user',
            'files',
            'templates'
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
            'get_templates',
            'get_files',
        ]),
        ...mapMutations([
            'ADD_TEXT',
            'SET_USER',
            'CLEAN_TAB_DUST',
            'UPDATE_TEXT_ARRAY',
            'UPDATE_QTERMS_INDEX',
            'RESOLVE_QTERM',
            'SET_TAB_ACTIVE',
            'CHANGE_TABLE_NAME',
            'ADD_TAB',
            'CHANGE_TAB_NAME',
            'CLOSE_TAB',
            'CHANGE_TAB_ID'
        ]),
        check_quality() {
            if (this.isEditorEmpty()) {
                return;
            }
            const text = this.editor.getText();
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
        half_resolved() {
            if (!this.activeTab.parsed && this.qterms.length==0) {
                this.$dialog.alert({
                    title: 'Check quality',
                    message: 'You need to check quality and resolve the terms.',
                    type: 'is-danger',
                    hasIcon: false,
                });
                return false;
            }
            const resolvedCount = this.qterms.filter(q => q.resolved).length;
            if (resolvedCount*2 < this.qterms.length) {
                this.$dialog.alert({
                    title: 'Terms needing more information',
                    message: 'You need to resolve at least 50% of the terms',
                    type: 'is-danger',
                    hasIcon: false,
                });
                return false;
            }
            return true;
        },
        formalize() {
            if (this.activeTab.type === 'table' || this.activeTab.isEditable===false) {
                this.$dialog.alert({
                    title: 'Check quality',
                    message: "Templates can not be matricized directly. Please clone the template into a file, then 'Check Quality', before matricize it.",
                    type: 'is-danger',
                    hasIcon: false,
                });
                return;
            }
            if (!this.half_resolved()) return;
            const resolvedCount = this.qterms.filter(q => q.resolved).length;
            if (resolvedCount < this.qterms.length) {
                this.$dialog.confirm({
                    title: 'Terms needing more information',
                    message: 'You have not resolve terms yet. Will you go back and continue resolve the remaining terms or ignore the warning and go ahead with the formalization?',
                    cancelText: 'Resolve',
                    confirmText: 'Matricize',
                    onCancel: () => {
                        return;
                    },
                    onConfirm: () => {
                        if (this.activeTab.parsed) {
                            this.open_table();
                        }
                    }
                });
            }
            else {
                if (this.activeTab.parsed) {
                    this.open_table();
                }
            }
        },
        confirm(qindex) {
            const replaceObj = this.replaceArray.find(r => r.qindex == qindex);
            const qterm = this.qterms[qindex];
            const app = this;
            if (replaceObj !== undefined && qterm != null) {
                qterm.index.forEach(i => {
                    app.editor.removeFormat(i.pos, i.length);
                    if (qterm.qType.type==='broad' || qterm.qType.type==='not_recommended') {
                        app.editor.deleteText(i.pos, i.length);
                        app.editor.insertText(i.pos, replaceObj.term);
                        app.UPDATE_QTERMS_INDEX({
                            pos: i.pos,
                            delta: replaceObj.term.length - i.length
                        });
                    } else {
                        app.editor.insertText(i.pos, replaceObj.term + ' ');
                        app.UPDATE_QTERMS_INDEX({
                            pos: i.pos,
                            delta: replaceObj.term.length + 1
                        });
                    }
                });
                app.UPDATE_TEXT_ARRAY({
                    html: app.editorContent,
                    text: app.editor.getText()
                });
                app.RESOLVE_QTERM(qindex);
            }
        },
        added(qindex) {
            const qterm = this.qterms[qindex];
            const app = this;
            if (qterm != null) {
                qterm.index.forEach(i => {
                    app.editor.removeFormat(i.pos, i.length);
                });
            }
        },
        tabNameChanged(tab) {
            const newName = document.getElementById('tab_'+tab.id).innerHTML.trim();
            this.CHANGE_TAB_NAME(newName);
            if (tab.tableOpen) {
                this.CHANGE_TABLE_NAME({
                    originTabID: tab.id,
                    newName
                });
            } else {
                if (this.files.find(f => f.id == this.activeTabID)) {
                    var updateUrl = 'users/' + this.user.id + '/file/' + this.activeTabID;
                    console.log('updateFileUrl', updateUrl);
                    var data = {
                        tabName: newName
                    };
                    this.db.ref(updateUrl).update(data);
                    this.get_files();
                } else if (this.templates.find(t => t.id == this.activeTabID)) {
                    const db = firebase.database();
                    var currentTemplate = db.ref('template/' + this.activeTabID);
                    currentTemplate.update({
                        tabName: newName
                    });
                    this.get_templates();
                }

            }
        },
        signout() {
            firebase.auth().signOut().then(() => {
                this.$router.replace('login');
            });
        },
        isEditorEmpty() {
            if (this.activeTab.type === "editor") {
                const text = this.editor.getText().replace(/(\r\n|\n|\r)/gm,"");
                if (text.replace(/\s/g, '')==='') {
                    return true;
                }
                return false;
            }
        },

        saveTabText() {
            if (!!this.editorContent) {
                const activeTabHasText = this.texts.find(t => t.tabID==this.activeTabID);
                const objToSave = {
                    html: this.editorContent,
                    text: this.editor.getText()
                };
                if (activeTabHasText !== undefined) {
                    this.UPDATE_TEXT_ARRAY(objToSave);
                } else {
                    this.ADD_TEXT(objToSave);
                }
            }
        },
        onSave(saveType) {
            var app = this;
            // Validation
            if (this.isEditorEmpty()) {
                return;
            }
            if (this.activeTab.type==="editor" && saveType==2 && !this.half_resolved()) {
                return;
            }
            // Variables for dialog
            const saveTitle = 'Save as a '+(this.activeTab.type==="table" ? "table" : (saveType==1 ? 'file' : 'template'));
//            let saveFileName = this.activeTab.name;
//            if (saveType==2) {
//                saveFileName += '.t';
//            }
            // Show confirm dialog
            this.$dialog.confirm({
                title: saveTitle,
                message: 'Are you sure to save the file as '+ "<input id='confirmFileName'>" + ' ?',
                cancelText: 'Cancel',
                confirmText: 'Save',
                onCancel: () => {
                    return;
                },
                onConfirm: () => {
                    console.log('clicked', $('#confirmFileName').val() + ' ' + saveType);
                    var saveFileName = $('#confirmFileName').val();
                    if (saveFileName == '') {
                        alert('You need to insert the file name.');
                        return;
                    }
                    if (saveType==2) {
                        saveFileName += '.t';
                    }
                    if (this.activeTab.type==="table") {
                        this.$refs.detable.saveTable();
                    } else {
                        const userID = this.user.id;
                        const currentTabName = this.activeTab.name;
                        const tabName = saveFileName;
                        const text = this.editor.getText();

                        const refID = saveType===1 ? "users/"+userID+"/file" : "template";
                        let checkURL = refID+"/"+this.activeTabID;

                        let storageItem = '';
                        if (saveType===1) {
                            storageItem = this.files.find(f => f.tabName == currentTabName);
                        } else {
                            storageItem = this.templates.find(t => t.tabName == currentTabName);
                        }
                        if (storageItem !== undefined) {
                            checkURL = refID+"/"+storageItem.id;
                            storageItem.tabName = saveFileName;
                        }

                        let data = {
                            tabName,
                            text
                        };
                        if (saveType==2) {
                            data.userID = userID;
                        }
                        this.db.ref(checkURL).once('value', snapshot => {
                            if (snapshot.exists() && saveType===1) {
                                this.db.ref(checkURL).update(data);

                                this.CHANGE_TAB_ID(storageItem.id);
                            } else {
                                const ret = this.db.ref(refID).push(data);
                                console.log('ret', ret);
                                this.editor.setText('');
//                                this.CHANGE_TAB_ID(ret.key);
                            }
                            if (saveType==1) {
                                this.get_files();
                                if (snapshot.exists()) {
                                    this.activeTab.name = data.tabName;
//                                    this.CHANGE_TAB_ID(storageItem.id);
                                } else {
//                                    var currentItem = this.files.find(f => f.tabName == tabName);
//                                    console.log('currentItem', this.files);
//                                    console.log('data.tabName', data.tabName);
//                                    console.log('currentItem', currentItem);
//                                    this.openFile(currentItem);
                                }
                            } else {
                                this.get_templates();
                            }
                        });
                    }
                }
            });
        },
        onExport() {
            if (this.isEditorEmpty()) {
                return;
            }
            let msg = '';
            let originTabName = this.activeTab.name;
            if (this.activeTab.type==='editor') {
                msg = originTabName + ' will be exported as '+
                        originTabName +
                        ".doc to your 'Downloads' folder";
            } else {
                originTabName = this.activeTab.name.split('.')[0];
                msg = 'All characters, values, source sentences will be exported as '+
                        originTabName + ".xls to your 'Downloads' folder";
            }
            this.$dialog.confirm({
                title: 'Export',
                message: msg,
                cancelText: 'Cancel',
                confirmText: 'Export',
                onCancel: () => {
                    return;
                },
                onConfirm: () => {
                    if (this.activeTab.type === 'editor') {
                        this.export2Doc(originTabName);
                    } else {
                        const exportData = this.$refs.detable.getExportData();
                        if (exportData) {
                            this.exportJSONToExcel(exportData, originTabName);
                        }
                    }
                }
            });
        },
        
        export2Doc(filename = '') {
            const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>\
            <head><meta charset='utf-8'>\
            <title>Export HTML To Doc</title>\
            <style>\
            u {\
                color: #ED553F;\
            }\
            </style>\
            </head><body>";
            const postHtml = "</body></html>";
            let text = this.editor.getText();
            this.bios.forEach(bio => {
                const bioIndex = text.toLowerCase().indexOf(bio.nameOrigin);
                const preBioStr = text.substring(0, bioIndex);
                if (preBioStr.trim().substr(preBioStr.trim().length-1)=='.' || preBioStr.trim()=='') {
                    const afxBioStr = text.substring(bioIndex+bio.nameOrigin.length);
                    text = preBioStr+'<b>'+text.substr(bioIndex, bio.nameOrigin.length)+'</b>' + afxBioStr;
                }
            });

            let html = preHtml+text+postHtml;

            const blob = new Blob(['\ufeff', html], {
                type: 'application/msword'
            });

            let url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
            filename = filename?filename+'.doc':'document.doc';
            let downloadLink = document.createElement("a");

            document.body.appendChild(downloadLink);

            if(navigator.msSaveOrOpenBlob) {
                navigator.msSaveOrOpenBlob(blob, filename);
            } else {
                downloadLink.href = url;
                downloadLink.download = filename;
                downloadLink.click();
            }
            document.body.removeChild(downloadLink);
        },
        exportJSONToExcel(data, filename = '') {
            const dataWS = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();

            filename = filename ? filename+'.xls' : 'excel_data.xls';
            XLSX.utils.book_append_sheet(wb, dataWS, 'Sheet1');

            XLSX.writeFile(wb, filename);
        },

        toggleTab($event, tabID) {
            this.saveTabText();
            if ($event.target.innerText !== "x") {
                this.SET_TAB_ACTIVE(tabID);
                const textObj = this.texts.find(t => t.tabID==tabID);
                if (!!textObj) {
                    this.editor.setText(textObj.text);
                } else {
                    this.editor.setText('');
                }
            }
        },
        openFile(file, type) {
            this.saveTabText();
            const isEditable = !file.hasOwnProperty('userID');
            if (this.tabs.find(t => t.id==file.id)===undefined) {
                this.ADD_TAB({
                    id: file.id,
                    type: 'editor',
                    name: file.tabName+(type=='template'?'.t':''),
                    tableOpen: false,
                    isEditable: isEditable, 
                    active: true
                });
                this.SET_TAB_ACTIVE(file.id);
                this.ADD_TEXT({
                    html: file.text,
                    text: file.text
                });
                this.editor.setText(file.text);
            }
        },
        openTable(table) {
            this.saveTabText();
            if (this.tabs.find(t => t.id==table.id)===undefined) {
                this.ADD_TAB({
                    id: table.id,
                    type: 'table',
                    name: table.tabName,
                    data: table.data,
                    active: true
                });
                this.SET_TAB_ACTIVE(table.id);
            }
        },
        clone() {
            this.saveTabText();
            const newID = uniqueID();
            const text = this.texts.find(t => t.tabID==this.activeTabID).text;
            this.ADD_TAB({
                id: newID,
                type: 'editor',
                isEditable: true,
                tableOpen: false,
                name: this.activeTab.name+'-Cloned',
                active: true
            });
            this.SET_TAB_ACTIVE(newID);
            this.ADD_TEXT({
                html: text,
                text
            });
            this.editor.setText(text);
        },
        closeTab(tabID) {
            this.CLOSE_TAB(tabID);
            const textObj = this.texts.find(t => t.tabID===this.tabs[0].id);
            let text = '';
            if (!!textObj) {
                text = textObj.text;
            }
            this.editor.setText(text);
        }
    }
}
</script>