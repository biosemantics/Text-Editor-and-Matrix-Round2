<template>
    <div class="card artboard">
        <div class="card-header has-background-light">
            <h4>Terms needing more information</h4>
        </div>
        <div class="card-content terms-list" ref="termsList">
            <div v-for="(q, i) in qterms" :key="i" class="term-item">
                <div class="term-item-top">
                    <div class="term-dot"></div>
                    <div class="term-content">
                        <div class="term-name"><b>{{ q.value }}</b></div>
                        <div class="term-solution">{{ termSolution(q) }}</div>
                    </div>
                    <button class="btn btn-danger btn-confirm" @click="onConfirm(i)">Confirm</button>
                    <div style="clear:both"></div>
                </div>
                <div class="notfound columns pl30" v-if="q.qType.type==='notfound'">
                    <div class="column is-6">
                        <button class="button is-success">Simply Add</button>
                    </div>
                    <div class="column">
                        <button class="button is-success">Add & Organize</button>
                    </div>
                </div>
                <div class="syn-case" v-if="q.qType.type==='broad' || q.qType.type==='not_recommended'" :data-qtype-id="i">
                    <div class="columns pl30 mb20" v-for="(o, j) in q.qType.ontology" :key="j">
                        <div class="column is-4 syn">
                            <input type="radio" 
                                v-bind:id="o.matchingTerm.replace(/ /g,'').toLowerCase()" 
                                :name="q.value" 
                                @click="onSynonymSelected(i, o.matchingTerm)">
                            <label v-bind:for="o.matchingTerm.replace(/ /g,'').toLowerCase()">{{ o.matchingTerm }}</label>
                        </div>
                        <div class="column is-8 def">
                            {{ termDefinition(o.matchingTerm)  }}
                        </div>
                    </div>
                    <div class="columns pl30 mb20">
                        <div class="column is-4">
                            Select a term from the tree:
                        </div>
                        <div class="column is-8">
                            <tree 
                                :data="treeData"
                                @node:selected="onNodeSelected"
                            />
                        </div>
                    </div>
                </div>
                <div class="multi_assoc" v-if="q.qType.type==='multi_assoc'">
                    <div class="columns pl30 mb20" v-for="(a, j) in q.qType.alterIDs" :key="j">
                        <div class="column is-4 syn">
                            <input type="radio" 
                                v-bind:id="getBio(a).replace(/ /g,'').toLowerCase()" 
                                :name="q.value" 
                                @click="onSynonymSelected(i, getBio(a))">
                            <label v-bind:for="getBio(a).replace(/ /g,'').toLowerCase()">{{ getBio(a) }}</label>
                        </div>
                        <div class="column is-8 def">
                            {{ getRevisedSentenceByBio(a) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex';

export default {
    name: 'art-board',
    computed: {
        ...mapState([
            'bios',
            'statements',
            'qterms',
            'user',
            'activeTabIndex',
            'ontologyDefArray',
            'treeData'
        ]),
    },
    methods: {
        ...mapActions([
            'set_replace_array'
        ]),
        setScroll(nth) {
            console.log(document.querySelector('.terms-list .term-item:nth-child('+(nth+1)+')').offsetTop);
            this.$refs.termsList.scrollTop = document.querySelector('.terms-list .term-item:nth-child('+(nth+1)+')').offsetTop;
        },
        termSolution(qterm) {
            const typeStr = qterm.qType.type;
            const messageArray = {
                notfound: 'is a new term, add the term to the dictionary',
                broad: 'means',
                not_recommended: 'has high ambiguity and is not recommended. Choose an alternative below',
                multi_assoc: 'is ambiguous. The whole sentence may be revised to'
            };
            return messageArray[typeStr];
        },
        termDefinition(term) {
            const obj = this.ontologyDefArray.find(o => o.term === term);
            if (obj && obj.hasOwnProperty('def'))
                return obj.def;
            return '';
        },
        onNodeSelected(node) {
            const syncaseDOM = node.vm.$el.closest('.syn-case');
            if (syncaseDOM.querySelector('input[type="radio"]:checked'))
                syncaseDOM.querySelector('input[type="radio"]:checked').checked = false;
            this.set_replace_array({
                qindex: syncaseDOM.dataset.qtypeId, 
                syn: node.text
            });
            // console.log('qtype id: ',syncaseDOM.dataset.qtypeId);
            // console.log(node.vm.$el.closest('.syn-case'));
        },
        onSynonymSelected(qindex, matchingTerm) {
            // console.log('qterm index', qindex);
            // console.log('matching term', matchingTerm);
            this.set_replace_array({
                qindex, 
                syn: matchingTerm
            });
        },
        onConfirm(qindex) {
            this.$emit('confirm', qindex);
        },
        getBio(bio_id) {
            const bio = this.bios.find(b => b.id == bio_id);
            if (bio) {
                return bio.nameOrigin;
            } else
                return '';
        },
        getRevisedSentenceByBio(bio_id, qvalue) {
            /* const jsUcfirst = function(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            } */
            const bio = this.bios.find(b => b.id == bio_id);
            const statement = this.statements.find(s => s.id == bio.statementID);
            const newSt = statement.text.replace(qvalue, bio.nameOrigin);
            return newSt;//jsUcfirst(newSt);
        }
    }
}
</script>