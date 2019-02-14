export function parseOntologyId(ontologyMatchingInfo) {
    const arrayInfo = ontologyMatchingInfo.split(/\s?;\s?/);
    let resultArray = [];
    arrayInfo.forEach(info => {
        const startIndex = info.indexOf('[');
        const endIndex = info.indexOf(']');
        const mainResult = info.substring(startIndex+1,endIndex);
        const firstColonIndex = mainResult.indexOf(':');
        const slashIndex = mainResult.indexOf('/');
        const lastColonIndex = mainResult.lastIndexOf(':');
        const scorePart = mainResult.substring(lastColonIndex + 1, mainResult.length);
        const broadIndex = scorePart.indexOf('b');

        resultArray.push({
            ontologyID: info.substring(0, startIndex),
            searchTerm: mainResult.substring(0,firstColonIndex),
            matchingParentTerm: mainResult.substring(firstColonIndex+1, slashIndex),
            matchingTerm: mainResult.substring(slashIndex + 1, lastColonIndex),
            matchingScore: mainResult.substring(lastColonIndex + 1, (broadIndex<0 ? mainResult.length : mainResult.length-1)),
            broad: broadIndex<0 ? false : true
        });
    });
    return resultArray;
}

export function stripHtml(html) {
    var temporalDivElement = document.createElement("div");
    temporalDivElement.innerHTML = html;
    // Retrieve the text property of the element (cross-browser support)
    return temporalDivElement.textContent || temporalDivElement.innerText || "";
}

export function findAllIndex(heap, needle) {    
    let arrayIndex = [];
    let pos = heap.indexOf(needle);
    while (pos !== -1) {
        arrayIndex.push({
            pos,
            length: needle.length,
            value: needle
        });
        pos = heap.indexOf(needle, pos + 1);
    }
    return arrayIndex;
}

export function getQType(ontology, notes, bioID) {
    let qtype = [];
    if (!ontology) {
        qtype.push({
            type: 'notfound',
            interval: null
        });
    } else {
        if (ontology.length > 1) {
            for (let i=0; i<ontology.length; i++) {
                if (ontology[i].broad && ontology[i+1].broad && ontology[i].searchTerm==ontology[i+1].searchTerm) {
                    qtype.push({type: 'broad', ontology});
                    break;
                }
            }
        }
        if (ontology.length > 0) {
            let positiveScoreIndex = -1;
            for (let i=0; i<ontology.length; i++) {
                if (parseInt(ontology[i].matchingScore)>=0) {
                    positiveScoreIndex = i;
                }
            }
            if (positiveScoreIndex == -1) {
                qtype.push({
                    type: 'not_recommended',
                    ontology
                });
            }
        }
    }
    if (!!notes) {
        const alterIDsString = notes.split(/\s?:\s?/)[1];
        let alterIDs = alterIDsString.split(/\s?;\s?/);
        alterIDs.unshift(bioID);
        qtype.push({
            type: 'multi_assoc', 
            alterIDs
        });
    }
    return qtype;
}

export function uniqueID() {
    return new Date().getTime();
}

export function ExportTableToExcel(tableID, filename = '') {
    var downloadLink;
    var dataType = 'application/vnd.ms-excel';
    var tableSelect = document.getElementById(tableID);
    var tableHTML = tableSelect.outerHTML.replace(/ /g, '%20');

    // Specify file name
    filename = filename?filename+'.xls':'excel_data.xls';

    // Create download link element
    downloadLink = document.createElement("a");

    document.body.appendChild(downloadLink);

    if(navigator.msSaveOrOpenBlob) {
        var blob = new Blob(['\ufeff', tableHTML], {
            type: dataType
        });
        navigator.msSaveOrOpenBlob( blob, filename);
    } else {
        // Create a link to the file
        downloadLink.href = 'data:' + dataType + ', ' + tableHTML;

        // Setting the file name
        downloadLink.download = filename;

        //triggering the function
        downloadLink.click();
    }
}

