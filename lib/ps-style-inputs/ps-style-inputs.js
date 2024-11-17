

/**
 * mutation observer
 * inject/replace dynamically added icons
 */


let mutationElInputs = document.querySelectorAll('.mutation-listen');
let mutationOptionsInputs = {
    childList: true,
    subtree: true
};

let inputsEnhanced = false;


function mutationCallbackInputs(mutations) {

    for (let mutation of mutations) {
        if (mutation.type === 'childList' ) {
            inputsEnhanced = true;
            console.log('mutation');
            setTimeout(() => {
                //console.log('Mutation Detected:', mutation.target);
                enhanceInputs()
            }, 10)

        }
    }
}

mutationElInputs.forEach(el=>{
    const mutationObserverInputs = new MutationObserver(mutationCallbackInputs);
    mutationObserverInputs.observe(el, mutationOptionsInputs);

})




window.addEventListener('DOMContentLoaded', (e)=>{
    //enhanceInputs();
    //console.log('enhance inputs');
})


function enhanceInputs(selector = "input[type=checkbox], input[type=radio]") {
    let inputs = document.querySelectorAll(selector);
    function parseSvgIcon(markup) {
        let svg = new DOMParser()
            .parseFromString(markup, "text/html")
            .querySelector("svg");
        svg.removeAttribute("xmlns");
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        return svg;
    }

    function addFeatherIcons(iconNames = []) {
        let icons = [];
        iconNames.forEach((iconName, i) => {
            let iconMarkup;

            // take svg markup or retrieve via feather object
            if (typeof feather == "object" && !iconName.includes("<svg")) {
                iconMarkup = feather.icons[iconName].toSvg();
            } else {
                iconMarkup = iconName;
            }
            let icon = parseSvgIcon(iconMarkup);
            icon.classList.add("feather-input-icon", `feather-input-icon${i + 1}`);
            icons.push(icon);
        });
        return icons;
    }

    let featherIcons = {
        checkbox: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-square feather-input-icon feather-input-icon1">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" style="fill:var(--color-bg, white)"/></svg>`,
        checkboxChecked: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check-square feather-input-icon feather-input-icon2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" style="stroke:none;fill:var(--color-bg, white)"/>
    <polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
        radio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-circle feather-input-icon feather-input-icon1">
    <circle cx="12" cy="12" r="10" style="fill:var(--color-bg, white)" ></circle></svg>`,
        radioChecked: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-circle feather-input-icon feather-input-icon1"><circle cx="12" cy="12" r="10" style="fill:var(--color-bg, white)" /> <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" /></svg>`
    };

    for (let i = 0; i < inputs.length; i++) {
        let inp = inputs[i];
        let type = inp.type;
        let parent = inp.parentNode;
        let needsWrapping =
            parent.nodeName.toLowerCase() === "label" ? false : true;

        let style = window.getComputedStyle(inp)
        let { marginLeft, marginRight } = style;

        //already processed
        if (parent.classList.contains('input-wrap')) continue
        if (parent.querySelector('svg')) continue

        // wrap inputs
        if (needsWrapping) {
            let label = inp.previousElementSibling;
            label = label.nodeName.toLowerCase() === "label" ? label : "";

            let sibling = inp.nextSibling;
            parent = label ? label : document.createElement("span");

            if (label) {
                label.insertBefore(inp, label.childNodes[0]);
            } else {
                inp.parentNode.insertBefore(parent, parent.children[0]);
            }
            parent.append(inp, sibling);
        }


        parent.classList.add("input-wrap");

        let iconWrap, icons;

        iconWrap = document.createElement("span");
        iconWrap.classList.add("input-icon-wrap");
        parent.insertBefore(iconWrap, parent.children[0]);

        iconWrap.style.marginLeft = parseFloat(marginLeft) - 1 + 'px';
        iconWrap.style.marginRight = parseFloat(marginRight) - 1 + 'px';;


        switch (type) {
            case "checkbox":
                icons = addFeatherIcons([
                    featherIcons["checkbox"],
                    featherIcons["checkboxChecked"]
                ]);
                //append
                iconWrap.append(...icons);
                break;

            case "radio":
                icons = addFeatherIcons([
                    featherIcons["radio"],
                    featherIcons["radioChecked"]
                ]);
                //append
                iconWrap.append(...icons);
                break;

            default:
            // input
        }
    }
}
