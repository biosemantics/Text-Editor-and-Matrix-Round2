
export function parseOntologyId(ontologyMatchingInfo) {
    const arrayInfo = ontologyMatchingInfo.split(';');
    arrayResult = [];
    arrayInfo.forEach(info => {
        const startIndex = info.indexOf('[');
        const endIndex = info.indexOf(']');
        const mainResult = info.substring(startIndex+1,endIndex);
        const firstColonIndex = mainResult.indexOf(':');
        const slashIndex = mainResult.indexOf('/');
        const lastColonIndex = mainResult.lastIndexOf(':');

        arrayResult.push({
            ontologyID: info.substring(0, startIndex),
            searchTerm: mainResult.substring(0,firstColonIndex),
            matchingParentTerm: mainResult.substring(firstColonIndex+1, slashIndex),
            matchingTerm: mainResult.substring(slashIndex + 1, lastColonIndex),
            matchingScore: mainResult.substring(lastColonIndex + 1, mainResult.length),
        });
    })
    return arrayResult;
}

export function stripHtml(html) {
    var temporalDivElement = document.createElement("div");
    temporalDivElement.innerHTML = html;
    // Retrieve the text property of the element (cross-browser support)
    return temporalDivElement.textContent || temporalDivElement.innerText || "";
}

export function findAllIndex(heap, needle) {
    let pos = heap.indexOf(needle);
    let array_index = [];
    while (pos !== -1) {
        array_index.push(pos);
        pos = heap.indexOf(needle, pos + 1);
    }
    return array_index;
}