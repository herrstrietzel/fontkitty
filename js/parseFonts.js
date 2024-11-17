async function getFontFaceFromFont(fontUrl, returnObject = false) {

    let buffer, ext;

    //is file object
    if (typeof fontUrl === 'object') {
        let filename = fontUrl.name;
        ext = fontUrl.name.split('.').slice(-1)[0];
        buffer = await fontUrl.arrayBuffer();
        fontUrl = URL.createObjectURL(fontUrl);
    }

    // is url
    else {
        ext = fontUrl.split('.').slice(-1)[0]
        buffer = await (await fetch(fontUrl)).arrayBuffer();
    }


    // decompress woff2
    if (ext === "woff2") {
        buffer = Uint8Array.from(Module.decompress(buffer)).buffer;
    }

    let font = opentype.parse(buffer);
    let { names, tables, glyphs } = font

    // check VF axes
    let fvar = tables.fvar ? tables.fvar : '';
    let axes = fvar ? fvar.axes : [];

    let axesVals = {}
    axes.forEach(axis => {
        let tag = axis.tag;
        axesVals[tag] = [axis.minValue, axis.maxValue]
    })


    // get name records
    let preferredFamily = names.preferredFamily ? names.preferredFamily : names.fontFamily;
    // font name may contain weight or style
    let weightInName = preferredFamily.en.match(/thin|extralight|light|regular|medium|semibold|bold|extrabold|black/gi)
    weightInName = weightInName ? weightInName[0].toLowerCase() : '';
    preferredFamily.en = preferredFamily.en.replace(/thin|extralight|light|regular|medium|semibold|bold|extrabold|black/gi, '');

    // get styles and weights
    let preferredSubfamily = names.preferredSubfamily ? names.preferredSubfamily : names.fontSubfamily;
    let variants = [...new Set([weightInName, preferredSubfamily.en.toLowerCase().split(' ')].flat())];
    let isItalic = variants.includes('italic');
    let style = isItalic ? 'italic' : 'normal';
    let weight = axesVals.wght ? `${axesVals.wght[0]} ${axesVals.wght[1]}` : variants[0];
    let fontStretch = axesVals.wdth ? `${axesVals.wdth[0]}% ${axesVals.wdth[1]}%` : 'normal';

    // map weights to numeric values
    let weightValue = weight || 400
    if (!axes.length) {

        switch (weight) {

            case 'thin':
                weightValue = 100
                break;

            case 'extralight':
                weightValue = 200
                break;

            case 'light':
                weightValue = 300
                break;

            case 'regular':
                weightValue = 400
                break;

            case 'medium':
                weightValue = 500
                break;

            case 'semibold':
                weightValue = 600
                break;

            case 'bold':
                weightValue = 700
                break;

            case 'extrabold':
                weightValue = 800
                break;

            case 'black':
                weightValue = 900
                break;
        }
    }


    /**
     * get unicode range
     */
    let glyphsAll = glyphs.glyphs
    let unicodes = []

    //console.log(glyphsAll);

    for (let key in glyphsAll) {
        let g = glyphsAll[key];

        let path = g.getPath().commands
        //console.log(path);
        if (path.length) {
            //let uni = g.unicode ? g.unicode : (g.name.length === 1 ? g.name.charCodeAt(0) : null)
            // include only glyphs with unicode
            let uni = g.unicode ? g.unicode : null;
            if (uni) unicodes.push(uni)
        }
    }
    //console.log(unicodes);

    // conver to ranges
    let unicodeRange = toUnicodeRange(unicodes)

    // get format identifier
    let format = ext;

    if (format === 'ttf') {
        //console.log('ttf detected???');
        format = 'truetype';
    }
    else if (format === 'otf') {
        format = 'opentype';
    }

    //console.log('format', format);


    //get weight
    let info = {
        fontFamily: preferredFamily.en,
        fontWeight: weightValue,
        fontStyle: style,
        fontStretch: fontStretch,
        unicodeRange: unicodeRange,
        src: fontUrl,
        ext: ext,
        format: format
    }

    let CSS = `
      @font-face{
        font-family: "${info.fontFamily}";
        font-weight: ${info.fontWeight};
        font-style:  ${info.fontStyle};
        src: url("${fontUrl}") format("${format}");
        display: swap;
        unicode-range:  ${info.unicodeRange};
      }`;


      //console.log('fontdata:', info);
      //console.log('fontdataCSS:', CSS);
      return !returnObject ? CSS : { data: info, css: CSS };

}
