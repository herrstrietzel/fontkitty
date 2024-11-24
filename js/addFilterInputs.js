function getFilterInputs(fontData=[], radios=[], presets={}, exclude=[], addLabels=true, labels=[]) {

    let fontProperties = {
        fontWeight: [],
        fontStyle: [],
        subset: [],
    }

    //console.log('fontData', fontData);

    fontData.fontFaceArr.forEach(font => {
        fontProperties.fontWeight.push(font.fontWeight)
        fontProperties.fontStyle.push(font.fontStyle)
        fontProperties.subset.push(font.subset)
    })

    // deduplicate
    for (let prop in fontProperties) {
        fontProperties[prop] = [...new Set(fontProperties[prop])].sort()
    }
    //console.log(fontProperties);

    let filterInputHtml = getfilterInputsFromObj(fontProperties, radios, presets, exclude, addLabels, labels);

    return filterInputHtml;
}
