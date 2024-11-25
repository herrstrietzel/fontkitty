let btnDownload = document.getElementById('btnDownload');
let label = btnDownload.querySelector('.btn-label')
let labelStatus = btnDownload.querySelector('.btn-label-status')
let lastSrc = '';
let newSrc = false;




/**
 * init settings
 * from inputs
 */
let inputs = document.querySelectorAll('.inputs');
let settings = bindSettingInputs(inputs)
settings.filters = {}
//console.log('settings', settings);

/**
 * collect font data
 * if fonts/Urls have changed
 */

let fontData = {
    fontFaceArr: [],
    styleRules: [],
    css: '',
    errors: [],
    cache: {}
}

// load fontlist
let fontList = [];
(async () => {
    let fontlistCacheUrl = 'https://herrstrietzel.github.io/google-font-finder/cache/fontList_merged.json';
    let res = await fetch(fontlistCacheUrl);
    fontList = await res.json();
})();

// filter input defaults
let radios = [];
let presets = {
    fontWeight: ['all'],
    fontStyle: ['regular', 'italic', 'normal', 'all'],
    subset: ['all']
};
let exclude = [];
let labels = ['Font weights', 'Font styles', 'Subsets/languages'];


for (let i = 0, len = inputs.length; len && i < len; i++) {
    let inp = inputs[i];

    inp.addEventListener('input', async (e) => {

        linkGF.innerHTML='';
        let value = inp.value;
        let url = inputUrl.value;

        /**
         * if is url field
         * reset if url was changed
         */
        if (inp.id === 'inputUrl' || (inp.id === 'inputCustomSubset' && url.includes('googleapis.com'))) {

            //url too short
            if (url.lenghth < 5 || (!url.includes('http') || !url.includes('/'))) return false

            // update input 
            await updateFontsInputAndCSS(url)

        } else {

        }

        await updateFilteredCSS(fontData, settings);

        /**
         * check availability on google fonts
         */

        //if is google font
        //console.log('fontList', fontList);
        //console.log('fontData', fontData);

        let item = fontList.filter(it => { return it.family === fontData.fontFaceArr[0].fontFamily })
        let isGoogleFont = item.length

        if(isGoogleFont){
            let family = fontData.fontFaceArr[0].fontFamily;
            let familyUrl = family.replaceAll(' ', '+')
            linkGF.innerHTML=`<p class="txt-cnt"><strong>»${family}«</strong> is a google font. <br> 
            You can get a more optimized fontkit using fontkitty's big sister 
            <strong>gffi – a google font finder</strong> which is specialized for google fonts and provides advanced options like variable font axis removal or downloading complete (unsubset version). <br> <a data-icon="arrow-right" rel="noopener noreferrer" href="https://herrstrietzel.github.io/google-font-finder/font/?family=${familyUrl}"><svg viewBox="0 0 100 100" class="icn-svg icn-arrow-right"><use href="#icn-arrow-right"></use></svg> Open »${family}« in gffi</a></p>`;

        }
        //console.log(isGoogleFont, fontData, item, fontData.fontFaceArr[0]);


    })
}


// add test example
//inputUrl.dispatchEvent(new Event('input'));


//updateOptions(inputs)
inputFontFile.addEventListener('input', async e => {
    let files = [...e.currentTarget.files];
    let file = e.currentTarget.files[0];
    let fileExt = file.name.split('.').slice(-1)

    // add font mime type
    filelist.textContent = '';
    file = new File([file], file.name, { type: `font/${fileExt}` });
    settings.url = file;

    let fileListItems = files.map(file => { return `<li class="li-file">${file.name}</li>` }).join('');
    filelist.insertAdjacentHTML('beforeend', fileListItems);

    // update
    updateFontsInputAndCSS(file, fontData, settings)

})



/**
 * create fontkit
 */
btnDownload.addEventListener('click', async (e) => {
    let href = btnDownload.getAttribute('href')
    // was reset - load new fontkit
    if (!href) {
        e.preventDefault();

        //update css
        //updateCSS(settings, true)
        await renderPreview()

        //show loading spinner
        btnDownload.dataset.iconState = '0';
        if (settings.outputFormat === 'zip') {
            //console.log('download', fontData);
            await generateZippedFontKit(btnDownload)
            btnDownload.dataset.iconState = '1';
            btnDownload.click();
        }
    }
})


btnUploadIcon.addEventListener('click', async (e) => {
    inputFontFile.click();
})


function togglePreview() {
    let body = document.body

    if (body.classList.contains('hide-preview')) {
        body.classList.replace('hide-preview', 'show-preview')
    } else {
        body.classList.replace('show-preview', 'hide-preview')
    }

}



async function updateCSS(settings, addPreview = false) {
    let css = await createFontKitFromCSS(settings.url, settings.onlyFontFace, settings.onlyModern, settings.outputFormat, settings.path);

    if (addPreview) {
        let fontFaceArr = settings.fontFaceArr;

        //stylePreview
        let cssPreview = await createFontKitFromCSS(settings.url, settings.onlyFontFace, settings.onlyModern, 'base64', settings.path);

        // add preview
        let html = ''

        fontFaceArr.forEach(item => {

            //detect language
            // has subset info
            let lang = item.subset ? item.subset : detectLanguageSet(item.unicodeRange);

            // in PUA – icon font
            let isPUA = lang === 'PUA';
            let dummyText = 'Hamburglefonstiv 012345';

            if (isPUA) {
                dummyText = gfontRangeToString(item.unicodeRange).join(' ');
            } else {
                //gfontRangeToString(item.unicodeRange)
                dummyText = lang ? dummyTexts[lang] : (item.chars ? item.chars.join(' ') : '');
                dummyText = dummyText ? dummyText : 'Hamburglefonstiv 012345';

            }


            // icon fonts
            let chars = item.chars;
            if (chars.length) dummyText = chars.join(' ');


            let fontWeights = item.fontWeight.split(' ')
            //.map(Number)
            if (fontWeights.length > 1) {
                fontWeights = fontWeights.map(Number)
                let fontWeights2 = [fontWeights[0]]
                let steps = (fontWeights[1] - fontWeights[0]) / 100
                let wght = fontWeights[0]
                for (let i = 0; i < steps; i++) {
                    wght += 100
                    fontWeights2.push(wght)
                }
                fontWeights = fontWeights2

            }
            fontWeights.forEach(wght => {
                html += `<p style="font-family:'${item.fontFamily}'; font-weight:${wght}; font-style:${item.fontStyle};">
            ${dummyText}
            <span style="font-family:sans-serif; font-size:0.7em; font-weight:400; font-style:normal">${item.fontFamily} ${wght} ${item.fontStyle} ${lang}</span>
            </p>`
            })
        })

        //add to preview
        iframePreview.srcdoc = `<!doctype html>
    <head>
    <style>
    ${cssMain}
    ${cssPreview}
    </style>
    </head>
    <body>
    ${html}
    </body>`;


        // output and download button
        settings.sampleHTML = html;
    }

    fontCss.value = css;
    settings.css = css;
    return css;
    //btnDownload.href = URL.createObjectURL(new Blob([css]));
}
























function getAbsoluteURLs(cssUrl, font) {
    let pathArr = []

    // is file
    if (typeof cssUrl === 'object') {
        cssUrl = URL.createObjectURL(cssUrl);

    } else {
        pathArr = cssUrl.split('/')
    }

    // base to convert relative to absolute Urls
    let baseUrl = pathArr.slice(0, -1).join('/')

    let urls = font.src;

    // is object url
    if (font.src.includes('blob:')) {
        font.srcAbsolute = urls
        return font;
    }

    /**
     * Absolute URLs: 
     * find relative paths or 
     * parent directory traversal
     */
    for (let i = 0; i < urls.length; i++) {
        let url = urls[i];
        let urlAbs = url;
        let dirs = url.split('../');
        let parentDirs = url.match(/\.\.\//g);
        let relativeDir = url.match(/\.\//g);
        let traverse = parentDirs ? parentDirs.length : 0;

        // traverse to parent directory
        if (traverse) {
            let index = -1 - traverse
            let fontPath = dirs.slice(-1)[0];
            baseUrl = pathArr.slice(0, index).join('/') + '/'
            urlAbs = baseUrl + fontPath;
        }
        else if (relativeDir) {
            urlAbs = url.replaceAll('./', baseUrl)
        }
        font.srcAbsolute[i] = urlAbs;

    }
    return font;
}



function getLocalFontName(font) {

    let { fontFamily, fontWeight, fontStyle, fontStretch, subset, src } = font;
    subset = settings.customSubset ? 'text_' + settings.customSubset : subset;

    /**
     * create readable font file names
     * based on properties
     */
    let fontname =
        fontFamily.replaceAll(" ", "") +
        "_" +
        [
            subset,
            fontWeight,
            fontStyle != "normal" ? fontStyle : "",
            fontStretch != "normal" && fontStretch !== "100%" ? fontStretch : ""
        ]
            .filter(Boolean)
            .map((val) => {
                return val.trim().replaceAll("%", "").replaceAll(" ", "-");
            })
            .join("_");


    src.forEach(url => {
        let ext = url.includes('kit=') ? 'woff2' : url.split('.').slice(-1)[0];

        if (url.includes('blob:')) {
            ext = font.ext
        }
        font.srcLocal.push(fontname + '.' + ext)
    })

    return font;
}


/**
 * fetched blob to base64
 */
function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

/**
 * input setting to helper
 */

function bindSettingInputs(inputs = null) {
    if (!inputs) return false;

    let settings = {}
    const getInputValue = (inp) => {
        let prop = inp.name
        let inpType = inp.type;
        if (inpType === 'checkbox') {
            settings[prop] = inp.checked
        }
        else if (inpType !== 'radio' || (inpType === 'radio' && inp.checked)) {
            settings[prop] = inp.value
        }
    }

    inputs.forEach(inp => {
        // add to setting object
        getInputValue(inp)
        inp.addEventListener('input', (e) => {
            getInputValue(e.currentTarget)
        })
    })

    //console.log(settings);
    return settings
}




/**
 * render preview
 */

async function renderPreview() {

    let settingsPreview = {
        ...settings,
        ...{
            outputFormat: 'base64'
        }
    }

    // create selfcontained CSS
    let cssPreview = await compileFilteredCSS(fontData, settingsPreview)

    // exclude rules by filters
    let fontFaceArrFiltered = fontData.fontFaceArr;
    if (Object.keys(settings.filters).length) {
        fontFaceArrFiltered = filterObjectArray(fontData.fontFaceArr, settings.filters)
    }


    // add preview
    let html = ''

    fontFaceArrFiltered.forEach(item => {

        //detect language
        // has subset info
        let lang = item.subset ? item.subset : detectLanguageSet(item.unicodeRange);

        // in PUA – icon font
        let isPUA = lang === 'PUA';
        let dummyText = 'Hamburglefonstiv 012345';

        if (isPUA) {
            dummyText = gfontRangeToString(item.unicodeRange).join(' ');
        } else {
            //gfontRangeToString(item.unicodeRange)
            dummyText = lang ? dummyTexts[lang] : (item.chars ? item.chars.join(' ') : '');
            dummyText = dummyText ? dummyText : 'Hamburglefonstiv 012345';

        }

        // icon fonts
        let chars = item.chars;
        if (chars.length) dummyText = chars.join(' ');


        let fontWeights = item.fontWeight.split(' ')
        //.map(Number)
        if (fontWeights.length > 1) {
            fontWeights = fontWeights.map(Number)
            let fontWeights2 = [fontWeights[0]]
            let steps = (fontWeights[1] - fontWeights[0]) / 100
            let wght = fontWeights[0]
            for (let i = 0; i < steps; i++) {
                wght += 100
                fontWeights2.push(wght)
            }
            fontWeights = fontWeights2

        }
        fontWeights.forEach(wght => {
            html += `<p style="font-family:'${item.fontFamily}'; font-weight:${wght}; font-style:${item.fontStyle};">
            ${dummyText}
            <span style="font-family:sans-serif; font-size:0.7em; font-weight:400; font-style:normal">${item.fontFamily} ${wght} ${item.fontStyle} ${lang}</span>
            </p>`
        })

    })

    //add to preview iframe

    //    

    iframePreview.srcdoc = `<!doctype html>
    <html lang="en">
    <head>
    <style>
    ${cssMain}
    ${cssPreview}
    </style>
    </head>
    <body>
    ${html}
    </body>
    </html>`;

    fontData.sampleHTML = html;
}




async function generateZippedFontKit(btnDownload) {

    let { fontFaceArr, css } = fontData;


    // exclude rules by filters
    let fontFaceArrFiltered = fontFaceArr;
    if (Object.keys(settings.filters).length) {
        fontFaceArrFiltered = filterObjectArray(fontFaceArr, settings.filters)
    }


    btnDownload.dataset.iconState = '2';
    let label = btnDownload.querySelector('.btn-label')
    let labelStatus = btnDownload.querySelector('.btn-label-status')
    label.textContent = 'Loading ...';


    let zip = new JSZip();
    let cssFontkit = '';
    let fontFamilyDir = fontFaceArrFiltered[0].fontFamilyDir;


    //add
    let cssPath = '';

    for (let i = 0; i < fontFaceArrFiltered.length; i++) {
        let font = fontFaceArrFiltered[i];

        let { srcAbsolute, srcLocal, src } = font;
        if (settings.onlyModern) {
            srcAbsolute = srcAbsolute.slice(0, 1)
            srcLocal = srcLocal.slice(0, 1)
        }
        let dir = settings.path;

        let traverseUpDirs = dir.match(/\.\.\//g);
        let parentDirs = dir.split('/');
        let traverse = traverseUpDirs ? traverseUpDirs.length : 0;
        let fontDir = dir.split('../').slice(-1)[0];

        // add parent directories to match relative path
        let root = '';
        for (let r = 0; r < traverse - 1; r++) {
            let index = r > 0 ? r + 1 : ''
            root += `root${index}/`
        }

        cssPath = `${root}css/${fontFamilyDir}.css`;
        zip.file(cssPath, css);

        // all font sources
        for (let s = 0; s < srcAbsolute.length; s++) {
            let fileSrc = srcAbsolute[s];
            let fileName = srcLocal[s];

            //fetch data
            let res = await (fetch(fileSrc));
            if (res.ok) {
                let buffer = await res.arrayBuffer();
                let filePath =
                    zip.file(fontDir + fileName, buffer, { type: "uint8array" });
            }
        }
    }



    let html =
        `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${font.fontFamily}</title>
    <link rel="stylesheet" href="${cssPath}">
    <style>
    body{
        font-family:'${font.fontFamily}'
    }
    </style>   
    </head>
    <body>
        ${fontData.sampleHTML}
    </body>
    </html>`;

    if (settings.addSample) {
        zip.file('sample.html', html);
    }

    //${articlePrev.innerHTML}
    //console.log(html);


    let blob = await zip.generateAsync({
        type: "blob"
    });
    btnDownload.href = await URL.createObjectURL(blob);
    //btnDownload.dataset.state = 'ready';
    btnDownload.dataset.iconState = '1';

    label.textContent = 'Download FontKit';
    labelStatus.textContent = ` (${+(blob.size / 1024).toFixed(1)} KB)`;

    btnDownload.download = `${fontFamilyDir}_fontkit.zip`;
}


function toggleDownloadBtn(btnDownload) {
    let label = btnDownload.querySelector('.btn-label')
    let labelStatus = btnDownload.querySelector('.btn-label-status')
    label.textContent = 'Get FontKit';
    labelStatus.textContent = '';
    btnDownload.dataset.iconState = '1';
    btnDownload.href = '';
}


/**
 * drag and drop file input
 */

// Get references to the drop area and file input
const dropArea = document.getElementById('inputWrap');
const fileInput = document.getElementById('inputFontFile');

// Add event listeners for drag and drop events
['dragenter', 'dragover'].forEach(event => {
    dropArea.addEventListener(event, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('drag-over');
    });
});

['dragleave', 'drop'].forEach(event => {
    dropArea.addEventListener(event, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('drag-over');
    });
});

// Handle drop event to assign file to the file input
dropArea.addEventListener('drop', (e) => {
    let files = e.dataTransfer.files;

    if (files.length > 0) {
        fileInput.files = files; // Assign the dragged files to the file input
        //console.log("File dropped:", files[0]); // Display file info in console

        // Trigger a change event on the file input to notify any listeners
        let changeEvent = new Event('input');
        fileInput.dispatchEvent(changeEvent);
    }
});




//get main css for iframe previews
const cssMain = getMainCSS('cssMain');

function getMainCSS(cssId = '') {
    // find main stylesheet
    let stylesheets = [...document.styleSheets];
    let mainStylesheet = stylesheets.filter(style => { return style.ownerNode.id === cssId });
    mainStylesheet = mainStylesheet.length ? mainStylesheet[0] : stylesheets[0];
    let cssText = [...mainStylesheet.cssRules].map(rule => { return rule.cssText }).join('\n');
    return cssText;
}
