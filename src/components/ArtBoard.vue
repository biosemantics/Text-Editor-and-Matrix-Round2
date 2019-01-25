<template>
    <div class="card artboard">
        <div class="card-header">
            <h4>{{checkAllResolved() ? 'Everything looks good!' : 'Terms needing more information'}}</h4>
        </div>
        <div class="card-content terms-list" ref="termsList">
            <!-- QTerm Item Card -->
            <div v-for="(q, i) in qterms" :key="i" class="term-item">
                <!-- Things to resolve -->
                <div v-if="!q.resolved">
                    <div class="term-item-top">
                        <div class="term-dot dot-red"></div>
                        <div class="term-content">
                            <div class="term-name"><b>{{ q.value }}</b></div>
                            <div class="term-solution">{{ termSolution(q) }}</div>
                        </div>
                        <button class="btn bk-red btn-confirm" @click="onConfirm(i)">Confirm</button>
                        <div style="clear:both"></div>
                    </div>
                    <div class="notfound columns pl30" v-if="q.qType.type==='notfound'">
                        <div class="column is-6">
                            <a 
                                class="button bk-green-light"
                                target="_blank"
                                @click="checkIfAdded(q.value, i)"
                                v-bind:href="'http://shark.sbs.arizona.edu/add2ontologymodular/public/quick-form/'+q.value+'/'+user.name+'/carex'"
                            >
                                Simply Add
                            </a>
                        </div>
                        <div class="column">
                            <a 
                                class="button bk-green-light"
                                target="_blank"
                                @click="checkIfAdded(q.value, i)"
                                v-bind:href="'http://shark.sbs.arizona.edu/add2ontologymodular/public/wizard/'+q.value+'/'+user.name+'/carex'"
                            >
                                Add & Organize
                            </a>
                        </div>
                    </div>
                    <div class="syn-case" v-if="q.qType.type==='broad' || q.qType.type==='not_recommended'" :data-qtype-id="i">
                        <div class="columns pl30 mb20 pr10" v-for="(o, j) in q.qType.ontology" :key="j">
                            <div class="column is-4 syn">
                                <input type="radio" 
                                    v-bind:id="o.matchingTerm.replace(/ /g,'').toLowerCase()" 
                                    :name="q.value" 
                                    @click="onTermSelected(i, o.matchingTerm)">
                                <label v-bind:for="o.matchingTerm.replace(/ /g,'').toLowerCase()">{{ o.matchingTerm }}</label>
                            </div>
                            <div class="column is-8 def" @click="onDefine(o, q.bioID)">
                                {{ termDefinition(o.matchingTerm)  }}
                            </div>
                        </div>
                        <div class="columns pl30 mb20 pr10">
                            <div class="column is-4 syn">
                                <label>Select a term from the tree:</label>
                            </div>
                            <div class="column is-8">
                                <tree 
                                    :data="treeData"
                                    @node:selected="onTreeNodeSelected"
                                />
                            </div>
                        </div>
                    </div>
                    <div class="multi_assoc" v-if="q.qType.type==='multi_assoc'">
                        <div class="columns pl30 mb20 pr10" v-for="(a, j) in q.qType.alterIDs" :key="j">
                            <div class="column is-4 syn">
                                <input type="radio" 
                                    v-bind:id="getBioEntityNameOrigin(a).replace(/ /g,'').toLowerCase()" 
                                    :name="q.value" 
                                    @click="onTermSelected(i, getBioEntityNameOrigin(a))">
                                <label v-bind:for="getBioEntityNameOrigin(a).replace(/ /g,'').toLowerCase()">{{ getBioEntityNameOrigin(a) }}</label>
                            </div>
                            <div class="column is-8 def">
                                {{ getRevisedSentenceByBioID(a, q) }}
                            </div>
                        </div>
                    </div>
                </div>
                <!-- End of Things to resolve -->

                <!-- Resolved items -->
                <div v-if="q.resolved" class="resolved-qterm">
                    <div class="term-item-top">
                        <div class="term-dot dot-green"></div>
                        <div class="term-content">
                            <div class="term-name"><b>{{ q.value.slice(0, 12) }}</b></div>
                            <div class="term-solution">{{ termSolution(q) }}</div>
                            <div class="resolved-term">
                                <b>{{ getResolvedTerm(i).slice(0, 10) }}...</b>
                            </div>
                        </div>
                        <button class="btn bk-cyan btn-confirm" @click="qterms[i].showReview = !qterms[i].showReview">
                            {{ qterms[i].showReview ? 'Close' : 'Review' }}
                        </button>
                    </div>
                    <b-collapse class="panel" :open.sync="qterms[i].showReview">
                        <div class="syn-case" v-if="q.qType.type==='broad' || q.qType.type==='not_recommended'" :data-qtype-id="i">
                            <div class="columns pl30 mb20 pr10" v-for="(o, j) in q.qType.ontology" :key="j">
                                <div class="column is-4 syn" v-bind:class="{chosen: q.resolved && o.matchingTerm==replaceArray.find(r=>r.qindex==i).term}">
                                    <label>{{ o.matchingTerm }}</label>
                                </div>
                                <div class="column is-8 def">
                                    {{ termDefinition(o.matchingTerm)  }}
                                </div>
                            </div>
                            <div class="columns pl30 mb20 pr10">
                                <div class="column is-4 syn">
                                    <label>Select a term from the tree:</label>
                                </div>
                                <div class="column is-8">
                                    <tree :data="treeData"/>
                                </div>
                            </div>
                        </div>
                        <div class="multi_assoc" v-if="q.qType.type==='multi_assoc'">
                            <div class="columns pl30 mb20 pr10" v-for="(a, j) in q.qType.alterIDs" :key="j">
                                <div class="column is-4 syn">
                                    <label>{{ getBioEntityNameOrigin(a) }}</label>
                                </div>
                                <div class="column is-8 def">
                                    {{ getRevisedSentenceByBioID(a, q) }}
                                </div>
                            </div>
                        </div>
                    </b-collapse>
                </div>
                <!-- End of Resolved items -->
            </div>
            <!-- End QTerm Item Card -->
        </div>
        <b-modal :active.sync="openEditTermModal">
            <div class="modal-card" style="width: auto">
                <header class="modal-card-head">
                    <p class="modal-card-title">{{ matchingTermToEdit }}</p>
                </header>
                <section class="modal-card-body">
                    <b-field label="Definition">
                        <b-input maxlength="200" type="textarea" v-model="termToEdit.definition"></b-input>
                    </b-field>
                </section>
                <footer class="modal-card-foot">
                    <button class="button is-info" type="button" @click="onSubmitDefinition">Submit</button>
                </footer>
            </div>
        </b-modal>
    </div>
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex';
import axios from '@/network/axios';

export default {
    name: 'art-board',
    computed: {
        ...mapState([
            'bios',
            'statements',
            'qterms',
            'user',
            'activeTabID',
            'ontologyDefArray',
            'treeData',
            'replaceArray',
        ]),
        ...mapGetters([
            'activeTab',
        ]),
    },
    data: () => ({
        termToEdit: {
            user: '',
            ontology: '',
            definition: '',
            providedBy: 'hongcui',
            exampleSentence: '',
            classIRI: ''
        },
        matchingTermToEdit: '',
        openEditTermModal: false
    }),
    methods: {
        ...mapMutations([
            'UPDATE_TERM',
            'READY_TO_REPLACE',
            'RESOLVE_QTERM',
        ]),
        setScroll(nth) {
            // console.log(document.querySelector('.terms-list .term-item:nth-child('+(nth+1)+')').offsetTop);
            this.$refs.termsList.scrollTop = document.querySelector('.terms-list .term-item:nth-child('+(nth+1)+')').offsetTop;
        },
        termSolution(qterm) {
            const typeStr = qterm.qType.type;
            const unclearMessageObject = {
                notfound: 'is a new term, add the term to the dictionary',
                broad: 'means',
                not_recommended: 'has high ambiguity and is not recommended. Choose an alternative below',
                multi_assoc: 'is ambiguous. The whole sentence may be revised to'
            };
            const resolvedMessageObject = {
                notfound: 'added',
                broad: 'replaced with',
                not_recommended: 'replaced with',
                multi_assoc: 'associated with'
            };
            return qterm.resolved ? resolvedMessageObject[typeStr] : unclearMessageObject[typeStr];
        },
        termDefinition(term) {
            const obj = this.ontologyDefArray.find(o => o.term === term);
            if (obj && obj.hasOwnProperty('def'))
                return obj.def;
            return '';
        },
        onTreeNodeSelected(node) {
            const syncaseDOM = node.vm.$el.closest('.syn-case');
            if (syncaseDOM.querySelector('input[type="radio"]:checked'))
                syncaseDOM.querySelector('input[type="radio"]:checked').checked = false;
            this.READY_TO_REPLACE({
                qindex: syncaseDOM.dataset.qtypeId, 
                term: node.text
            });
        },
        onTermSelected(qindex, matchingTerm) {
            this.READY_TO_REPLACE({
                qindex, 
                term: matchingTerm
            });
        },
        onConfirm(qindex) {
            this.$emit('confirm', qindex);
        },
        getBioEntityNameOrigin(bioID) {
            return this.$store.getters.bioEntityNameOrigin(bioID);
        },
        getRevisedSentenceByBioID(bioID, q) {
            const bio = this.bios.find(b => b.id == bioID);
            const statement = this.statements.find(s => s.id == bio.statementID);
            let text = statement.text;
            const pos = text.indexOf(q.value);
            text = text.slice(0, pos) + bio.nameOrigin + ' ' + text.slice(pos);
            return text;
        },
        getResolvedTerm(qindex) {
            const replaceObj = this.replaceArray.find(r => r.qindex == qindex);
            return replaceObj.term;
        },
        onDefine(ontology, bioID) {
            const def = this.termDefinition(ontology.matchingTerm);
            this.matchingTermToEdit = ontology.matchingTerm;
            this.termToEdit.ontology = "carex";
            this.termToEdit.user = "";
            this.termToEdit.exampleSentence = this.$store.getters.statementByBioID(bioID);
            this.termToEdit.classIRI = ontology.ontologyID;
            this.termToEdit.definition = '';
            this.openEditTermModal = true;
        },
        onSubmitDefinition() {
            this.openEditTermModal = false;
            axios.defineTerm(this.termToEdit).then(resp => {
                if (resp.data == "SUCCESSFULLY") {
                    this.UPDATE_TERM({
                        term: this.matchingTermToEdit,
                        def: this.termToEdit.definition
                    });
                }
            }).catch(error => {
                console.log(error);
            })
        },
        checkIfAdded(term, qindex) {
            this.qterms[qindex].interval = setInterval(() => {
                axios.search(term).then(resp => {
                    console.log('searching..', resp.data);
                    if (resp.data.entries.length > 0 && resp.data.entries[0].score == 1.0) {
                        this.RESOLVE_QTERM(qindex);
                        clearInterval(this.qterms[qindex].interval);
                    }
                });
            }, 1000);
        },
        checkAllResolved() {
            return this.activeTab.parsed && this.qterms.find(q => !q.resolved)===undefined;
        }
    }
}
</script>