/**
 * 1. fetch url
 * 2. fetch CSS or create
 * 3. convert to object array
 * 4. filter array
 * 5. out put new CSS
 * 6. download fonts
 */



async function updateFontsInputAndCSS(inputValue) {


    // toggle sidebar
    if (document.body.classList.contains('hide-sidebar')) {
        document.body.classList.remove('hide-sidebar')
    }

    // reset field display  and values
    body.classList.replace('show-preview', 'hide-preview');
    fontCss.value = '';
    btnDownload.href = '';
    iframePreview.setAttribute('srcDoc', '');
    labelStatus.textContent = '';
    label.textContent = 'Get Fontkit';
    errorReport.textContent = '';


    /**
     * fetch and parse CSS
     * update fontdata
     */
    let dataNew = await getFontFaceObjectArr(inputValue);
    fontData = {
        ...fontData,
        ...dataNew
    }

    if (dataNew.errors.length) {
        errorReport.textContent = dataNew.errors.join(' ')
    }

    //append font family name to output path
    let dirName = fontData.fontFaceArr[0].fontFamilyDir;
    //settings.path = settings.path+dirName+'/'
    //inputPath.value = settings.path +dirName+'/'
    //console.log(fontData);


    /**
     * add filter inputs
     * add filters to settings
     */
    let filterInputHtml = getFilterInputs(fontData, radios, presets, exclude, true, labels);

    // render inputs
    propFilterInputs.innerHTML = filterInputHtml

    /**
    * update filters
    * and bind events
    */
    let filterInputs = propFilterInputs.querySelectorAll('.inpFilter');
    filterInputs.forEach(inp => {
        inp.addEventListener('input', async (e) => {

            errorReport.textContent = '';
            // update settings - add filters
            filter = getCurrentFilterObject(filterInputs);
            settings.filters = filter;

            toggleDownloadBtn(btnDownload)
            togglePreview();

            /**
             * compile new CSS
             * according to filters
             */
            await updateFilteredCSS(fontData, settings);

            toggleDownloadBtn(btnDownload)
            togglePreview();

        })
    })

    //reset download btn
    if (inputValue) {
        toggleDownloadBtn(btnDownload)
        togglePreview();
    }

    await updateFilteredCSS(fontData, settings);
    //console.log(fontData);
    //return fontData;

    //add preview if only a few fonts
    if (fontData.fontFaceArr.length <= 8) {
        await renderPreview(fontData)
    } else {
        errorReport.textContent = `The loaded CSS contains ${fontData.fontFaceArr.length} fonts – that's fine. However, you may check the filter options to the left to reduce the total filesize and speed up the  fontkit creation. Preview gets updated when you click the font kit download button.`
    }

}


async function updateFilteredCSS(fontData, settings) {
    let cssNew = await compileFilteredCSS(fontData, settings)
    //console.log('cssNew:', cssNew);
    // output to field
    fontData.css = cssNew;
    fontCss.value = cssNew;
}


async function getFontFaceObjectArr(url) {

    let ext, isFile;
    //is file object
    if (typeof url === 'object') {
        ext = url.name.split('.').slice(-1)[0];
        isFile = true
    } else {
        ext = url.split('.').slice(-1)[0];
        ext = ext ? ext.toLowerCase() : ''
    }

    let fontfiles = ['woff2', 'woff', 'ttf', 'otf'];
    //errorReport.textContent = '';

    /** 
     * collect data
     * in object
     */
    let data = {
        fontFaceArr: [],
        styleRules: [],
        css: '',
        errors: []
    }

    let css = '';

    // is font - parse font
    if (fontfiles.includes(ext)) {
        css = await getFontFaceFromFont(url)
    }
    // is CSS
    else {

        

        // css file upload - get the text content
        if (isFile) {
            css = await url.text()

        } else {

            // if is google you can add a custom subset param
            if( url.includes('googleapis.com')  && url.includes('?family=')   ){
                let textQuery = settings.customSubset ? `&text=${settings.customSubset}` : '';
                url +=textQuery;
            }


            let res = await fetch(url);

            // error report - quit
            if (!res.ok) {
                data.errors.push('Couldn’t fetch source. Check for misspelled URLs. Also, external resources must allow cross-origin access – check CORS headers.');
                //console.log('error');
                return data;
            }
            css = await res.text()
        }



    }


    //quit if file doesn't contain any fontface rules
    if (!css.includes('@font-face') && !css.includes('@import')) return '';


    /**
     * has import rule
     * fetch content and prepend
     * to CSS
     */
    if (css.includes('@import')) {

        let cssNew = document.createElement('style');
        cssNew.textContent = css;
        document.head.insertAdjacentElement('afterbegin', cssNew);

        //disable
        let cssObj = document.styleSheets[0]
        cssObj.disabled = true;

        let imports = [...cssObj.cssRules].filter(rule => { return rule.type === 3 })

        let importCss = '';
        for (let i = 0, len = imports.length; len && i < len; i++) {
            let src = imports[i].href;

            //must be external src
            if(!src.includes('//')) continue;

            let res = await (fetch(src))
            if (res.ok) {
                importCss += await res.text() + '\n'
            }
        }
        css = importCss + css;
        //cssNew.remove()
    }

    /**
     * start parsing to object array
     */

    // parse to style object to extract urls only from font-face rules
    let styleTmp = new CSSStyleSheet();
    styleTmp.replaceSync(css);
    let allRules = [...styleTmp.cssRules];
    let fontFaceRules = allRules.filter((item) => {
        return item.type === 5;
    });


    // get language subsets
    let comments = [...css.matchAll(/\/\*\s*(.*?)\s*\*\//g)];
    let subsets = comments ? comments.map(match => match[1]) : [];
    let hasSubset = subsets.length === fontFaceRules.length;
    //let hasOnlyFontface = allRules.length === fontFaceRules.length;


    fontFaceRules.forEach((rule, i) => {
        let style = rule.style;
        let subset = hasSubset ? `\n/* ${subsets[i]} */\n` : '';

        let item = {
            fontFamily: style.getPropertyValue('font-family').replaceAll('"', ""),
            fontFamilyDir: style.getPropertyValue('font-family').replaceAll('"', "").toLowerCase().replaceAll(' ', ''),
            fontWeight: style.getPropertyValue('font-weight') || '400',
            fontStyle: style.getPropertyValue('font-style') || 'normal',
            fontStretch: style.getPropertyValue('font-stretch') || 'normal',
            unicodeRange: style.getPropertyValue('unicode-range'),
            subset: subset,
            ext: ext,
            srcLocal: [],
            srcAbsolute: [],
            file: '',
            src: style.getPropertyValue("src").split(',').flat()
                // ignore local()
                .filter(src => { return !src.includes('local(') && !src.includes('.eot') })
                //remove format identifiers
                .map(url => { return url.trim().split(' ')[0].replace(/url\(|\)|'|"/gi, '') }),
            formats: [],
            chars: [],
            css: ''
        }


        item.src.forEach(src => {
            //let ext = item.file ? item.file.name.split('.').slice(-1)[0] : src.split('.').slice(-1)[0];
            let fontExts = ['woff2', 'woff', 'ttf', 'otf'];
            let ext = !fontExts.includes(item.ext) ? src.split('.').slice(-1)[0] : item.ext;

            if(ext.includes('kit=')) {
                ext='woff2';
                item.ext= ext;
                item.subset = 'text_'+settings.customSubset;
            }

            //console.log('ext: ', ext);
            //let ext = src.split('.').slice(-1)[0];
            let identifier = ext === 'ttf' ? 'truetype' : (ext === 'otf' ? 'opentype' : ext);
            //console.log('idetifier:', item, src, 'format:', ext, identifier);
            item.formats.push(identifier)
        })

        // add file object
        if (isFile) item.file = url;
        data.fontFaceArr.push(item);
    })

    /** 
     * compile css
     * 
     */
    css = '';

    // element style rules
    let styleRules = allRules.filter(rule => { return rule.type !== 5 })

    styleRules.forEach((rule, i) => {
        let cssText = rule.cssText
        if (rule.style && rule.style.hasOwnProperty('content')) {
            let content = rule.style.content ? rule.style.getPropertyValue('content').replaceAll('"', '') : '';

            // encode PUA characters for CSS
            if (content.length === 1) {
                let codePoint = '\\' + content.codePointAt(0).toString(16).padStart(4, '0')
                cssText = cssText.replaceAll(content, codePoint)
                data.fontFaceArr[data.fontFaceArr.length - 1].chars.push(content)
            }
        }
        data.styleRules.push(cssText)
    })

    // add subset info
    if (data.fontFaceArr.length === subsets.length) {
        data.fontFaceArr = data.fontFaceArr.map((item, i) => { item.subset = subsets[i]; return item })
    }


    // get local urls
    data.fontFaceArr.forEach((font, i) => {
        // add readable font names for CSS replacement
        getLocalFontName(font);
        //get absolute url
        getAbsoluteURLs(url, font);
    })


    return data;
}

async function compileFilteredCSS(fontData, settings) {

    let { filters, outputFormat, path, onlyModern } = settings;
    let { fontFaceArr, styleRules, cache } = fontData
    //fontFaceArr, filters, outputFormat, dir

    //console.log(settings.filters);
    let css = '';

    // exclude rules by filters
    let fontFaceArrFiltered = fontFaceArr;
    if (Object.keys(filters).length) {
        fontFaceArrFiltered = filterObjectArray(fontFaceArr, filters)
    }

    // create css from object

    for (let f = 0; f < fontFaceArrFiltered.length; f++) {
        font = fontFaceArrFiltered[f];
        let fontDisplay = settings.display || 'swap';
        let { fontFamily, fontWeight, fontStretch, fontStyle, src, srcLocal, srcAbsolute, subset, unicodeRange, formats } = font;


        // filter old fomats

        if (onlyModern && formats.length > 1) {
            let indexWoff2 = formats.indexOf('woff2')
            let indexWoff = formats.indexOf('woff')
            let indexTtf = formats.indexOf('truetype')
            let index = 0
            if (indexWoff2 > -1) {
                index = indexWoff2
            }
            else if (indexWoff > -1) {
                index = indexWoff
            }
            else if (indexTtf > -1) {
                index = indexTtf
            }
            src = [src[index]]
            formats = [formats[index]]
        }



        let fontSrc = src.map((f, i) => { return `url("${f}") format("${formats[i]}")` });
        let propUnicodeRange = unicodeRange ? `unicode-range:${unicodeRange};` : '';
        let fontDisplayProp = fontDisplay && fontDisplay !== 'none' ? `font-display: ${fontDisplay};\n` : '';
        //fontStyle = fontStyle ? fontStyle : 'normal';

        let fontStretchProp = fontStretch!=='normal' ? `font-stretch: ${fontStretch};\n` : '';

        let subsetComment = subset ? `/* ${subset} */\n` : '';
        let newCss = `${subsetComment}@font-face {\nfont-family: "${fontFamily}";\nfont-style: ${fontStyle};\nfont-weight: ${fontWeight};\n ${fontStretchProp} src: ${fontSrc};\n${fontDisplayProp}${propUnicodeRange}}\n\n`;

        css += newCss;

        for (let i = 0; i < src.length; i++) {
            let url = src[i];
            let newFilename = path + srcLocal[i];

            // base 64
            if (outputFormat === 'base64') {
                let urlAbs = srcAbsolute[i];

                // base 64 is cached
                let key = url.includes('blob:') ? font.file.name.replace(/\.|-/g, '') : url.replace(/:|\//g, '_')
                let isFile = url.includes('blob:');
                if (cache[key]) {
                    //console.log('is cached');
                    newFilename = cache[key]

                } else {
                    // fetch font files
                    let res = await fetch(urlAbs);

                    if (res.ok) {
                        // fetch font file
                        let blob = isFile ? font.file : await (res).blob();
                        // let blobNew = new Blob([])

                        //add correct mime type
                        blob = blob.slice(0, blob.size, `font/${formats[i]}`)

                        //blob.type=`font/${formats[i]}`;
                        //console.log(blob, formats);

                        //outputFormat
                        // create base64 string
                        let base64 = await blobToBase64(blob);
                        newFilename = `"${base64}"`;

                        // cache
                        //console.log('add to cache');
                        fontData.cache[key] = base64;


                    } else {
                        throw new Error("Font data couldn't be fetched – check CORS headers or file access permissions");
                    }
                }
            }

            //replace urls with new fontkit url
            css = css.replaceAll(url, newFilename).replaceAll('""', '"')
        }
    }

    // append element style rules
    if (!settings.onlyFontFace) {
        let styleRulesStr = styleRules.join('\n')
            .replaceAll('\t', '')
            .replaceAll('{', '{\n')
            .replaceAll('}', '}\n')
            .replaceAll('; ', ';\n');

        css += styleRulesStr
    }

    return css.trim()
}

