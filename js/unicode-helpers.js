const dummyTexts = {
    'latin': "The quick brown fox jumps over the lazy dog.",
    'latin-ext': "The quick brown fox jumps over the lazy dog.",
    'cyrillic': "Съешь же ещё этих мягких французских булок да выпей чаю.",
    'cyrillic-ext': "Съешь же ещё этих мягких французских булок да выпей чаю.",
    'greek': "Ξεσκεπάζω την ψυχοφθόρα βδελυγμία.",
    'greek-ext': "Ξεσκεπάζω την ψυχοφθόρα βδελυγμία.",
    'vietnamese': "Tiếng Việt là ngôn ngữ tuyệt vời.",
    'arabic': "نص حكيم له مواعظ مروية.",
    'hebrew': "דג סקרן שט בים זך ולפתע מצא חוף חם.",
    /*
    'math': "Γ Δ Θ Λ Ξ Π Σ Ω Σ Φ Ψ ω α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ ς σ τ υ φ χ ψ ϑ ϖ ′ ″ ′ ∂ ∆ ∏ ∑ − ∑ ∕ √ ∞ ∫ ≈ ≠ ≤ ≥ ≤ ◊",
    'symbols': ''
    */
};



function detectLanguageSet(unicodeRangeStr) {
    // Define known ranges (based on Unicode standards)
    let knownRanges = {
        'latin': [
            [0x0020, 0x007f], // Basic Latin
        ],

        'latin-ext': [
            [0x00a0, 0x00ff], // Latin-1 Supplement
            [0x0100, 0x017f], // Latin Extended-A
            //[0x0180, 0x024f] // Latin Extended-B
        ],

        'cyrillic': [
            [0x0400, 0x04ff], // Cyrillic
            //[0x0500, 0x052f], // Cyrillic Supplement
            //[0x2de0, 0x2dff], // Cyrillic Extended-A
            //[0xa640, 0xa69f] // Cyrillic Extended-B
        ],

        'cyrillic-ext': [
            [0x0500, 0x052f], // Cyrillic Supplement
            [0x2de0, 0x2dff], // Cyrillic Extended-A
            [0xa640, 0xa69f] // Cyrillic Extended-B
        ],

        'greek': [
            [0x0370, 0x03ff], // Greek and Coptic
            //[0x1f00, 0x1fff] // Greek Extended
        ],

        'greek-ext': [
            [0x0370, 0x03ff], // Greek and Coptic
            [0x1f00, 0x1fff] // Greek Extended
        ],

        'vietnamese': [
            [0x0102, 0x0103], // Vietnamese letters (Latin Extended-A subset)
            //[0x0110, 0x0111],
            //[0x0128, 0x0129],
            //[0x0168, 0x0169],
            //[0x01a0, 0x01a1],
            //[0x01af, 0x01b0],
            //[0x1ea0, 0x1ef9] // Vietnamese-specific Latin range
        ],


        'arabic': [
            [0x0600, 0x06ff], // Arabic
            //[0x0750, 0x077f], // Arabic Supplement
            //[0x08a0, 0x08ff], // Arabic Extended-A
            //[0xfb50, 0xfdff], // Arabic Presentation Forms-A
            //[0xfe70, 0xfeff] // Arabic Presentation Forms-B
        ],

        'hebrew': [
            [0x0590, 0x05ff], // Hebrew
            //[0xfb1d, 0xfb4f] // Hebrew Presentation Forms
        ],

        'PUA': [
            [0xE000, 0xF8FF],
            [0xF0000, 0xFFFFD],
            [0x100000, 0x10FFFD],
        ],

        /*
        'math': [
            [0x0020, 0x007f], // Basic Latin
            [0x0393, 0x25CA],
        ]
        */

        // Define more language ranges as needed
    };

    const parseUnicodeRange = (range) => {
        return range.split(",").map((part) => {
            const [start, end] = part.trim().replace("U+", "").split("-");
            const startCode = parseInt(start, 16);
            const endCode = end ? parseInt(end, 16) : startCode;
            return [startCode, endCode];
        });
    };

    const calculateAbsoluteOverlap = (userRanges, knownRange) => {
        let overlapCount = 0;

        knownRange.forEach(([knownStart, knownEnd]) => {
            userRanges.forEach(([userStart, userEnd]) => {
                const start = Math.max(knownStart, userStart);
                const end = Math.min(knownEnd, userEnd);
                if (start <= end) overlapCount += end - start + 1;
            });
        });

        return overlapCount;
    };

    // Parse user-specified unicode ranges
    const userRanges = parseUnicodeRange(unicodeRangeStr);

    // Calculate absolute overlaps for each language set
    const detectedSets = [];
    for (const [lang, ranges] of Object.entries(knownRanges)) {
        const overlapCount = calculateAbsoluteOverlap(userRanges, ranges);
        if (overlapCount > 0) {
            detectedSets.push({ language: lang, overlap: overlapCount });
        }
    }

    let bestMatch = detectedSets.sort((a, b) => b.overlap - a.overlap);
    bestMatch = bestMatch.length ? bestMatch[0].language : '';
    //console.log('bestMatch', bestMatch);
    // Return the best-matching language(s), sorted by overlap percentage
    return bestMatch;
}



function gfontRangeToString(rangesStr) {
    // collect all characters
    let allChars = [];
    //sanitize
    rangesStr = rangesStr
        .replaceAll("unicode-range:", "")
        .replaceAll(";", "")
        .trim();
    ranges = rangesStr.split(", ");
    ranges.forEach((range) => {
        range = range.replaceAll("U+", "").split("-");
        let ch0 = range[0];
        //console.log(ch0)
        let ind0 = hex2Dec(ch0);
        allChars.push(ind0);
        if (range.length > 1) {
            let ch1 = range[1];
            let ind1 = hex2Dec(ch1);
            allChars.push(ind1);
            // get intermediate codepoints in range
            let diff = ind1 - ind0;
            for (let i = 0; i < diff; i++) {
                let indI = ind0 + i;
                allChars.push(indI);
            }
        }
    });
    //deduplicate
    //allChars = [...new Set(allChars)];
    let charArr = allChars
        .map((val) => {
            let char = String.fromCharCode(val);
            let invisible = containsInvisibleCharacters(char)
            return !invisible ? char : '';
        }).filter(Boolean);


    return charArr;
}

function toUnicodeRange(codePoints) {
    //alert('oi')
    // Sort code points in ascending order
    codePoints.sort((a, b) => a - b);

    // Helper to format a single code point as U+XXXX
    let formatCodePoint = (point, addPrefix = true) => {
        let prefix = addPrefix ? 'U+' : ''
        return prefix + point.toString(16).toUpperCase().padStart(4, '0');
    }

    // Array to store ranges
    let ranges = [];
    let start = codePoints[0];
    let end = start;

    for (let i = 1; i < codePoints.length; i++) {
        if (codePoints[i] === end + 1) {
            // Continue the range if the next code point is consecutive
            end = codePoints[i];
        } else {
            // Add the current range to the list
            ranges.push(start === end ? formatCodePoint(start) : `${formatCodePoint(start)}-${formatCodePoint(end, false)}`);
            // Start a new range
            start = codePoints[i];
            end = start;
        }
    }

    // Add the final range
    ranges.push(start === end ? formatCodePoint(start) : `${formatCodePoint(start)}-${formatCodePoint(end, false)}`);

    // Join all ranges with commas
    return ranges.join(", ");
}

function toHexaDecimal(codePoint) {
    return "U+" + codePoint.toString(16).toUpperCase().padStart(4, '0');
}

function hex2Dec(hex) {
    return parseInt(hex, 16);
}

function charToHex(str) {
    // Get the Unicode code point of the character and convert it to hexadecimal
    const codePoint = str.charCodeAt(0);
    // Convert the code point to a hexadecimal string and pad with zeros if necessary
    return "U+" + codePoint.toString(16).toUpperCase().padStart(4, "0");
}


function unicodeRangeFromString(str) {
    let chars = [... new Set(str.split('').filter(Boolean))]
    let codePoints = chars.map(char=>{return char.charCodeAt(0)})
    let range = toUnicodeRange(codePoints);
    return range
}


function containsInvisibleCharacters(str) {
    // Regular expression to match most invisible characters
    let invisibleCharsRegex = /[\x00-\x1F\u00A0\u200B\u200C\u200D\u2060\uFEFF]/;

    // Test if the string contains any invisible character
    return invisibleCharsRegex.test(str);
}

function hex2Dec(hex) {
    return parseInt(hex, 16);
}

