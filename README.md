
<p align="center" class="logo-readme dsp-non" style="text-align:center">
<img width="150" height="150" style="display:inline-block" src="https://raw.githubusercontent.com/herrstrietzel/fontkitty/refs/heads/main/img/logo-fontkitty-04.2.svg">
</p> 

# Fontkitty
## A client-based font-kit generator  

### Features
Create fontkits from:
* external CSS URLs (e.g google fonts, bunny.net, cdnfonts etc)
* uploaded CSS files
* uploaded Font files
* external font URLs
* autocomplete list of google fonts (> 1700 families – including variable and static version )
* filter by properties like style, font-weights or languages/subsets
* option to remove legacy formats (e.g. truetype, otf)
* create selfcontained CSS with base64 encoded fonnt sources (handy for demos or SVG font embedding)
* create text based subsets (only for google font query URLs)

### Limitations
* no custom subsetting for font URLs or files – fontkitty doesn't change any font files
* no support for legacy format like `.svg` or `.eot`

### Differences to other tools
While there are already great tools (see section "Alternatives") they come with other limitations:  
* you can't scrape font files from URLs
* mostly limited to google fonts
* converted font files are recompiled which may break more advanced features like variable font axes or change hinting instructions
* missing option to choose between variable and static font output

Fontkitties main feature is its **CSS scraping** ability. In case you want to switch your CSS using external cdn font resources you can just load the existing CSS:   
All external font sources referenced in external URLs (fonts or `@import`) are replaced by local paths. All font files are included in the fontkit zip file.   


### Deployed libraries
* [opentype.js](https://github.com/opentypejs/opentype.js) – parses uploaded fonts to retrieve suitable family, weight and style values
* [jszip.js](https://github.com/Stuk/jszip) – for zipped fontkit creation
* [mdp.js](https://github.com/UmemotoCtrl/mdpjs) for readme parsing

### Found a bug?
Please file a bug report under [Issues](https://github.com/herrstrietzel/fontkitty/issues). You may also post in the discussions section.


### Related projects  
* [gffi – a google font finder](https://herrstrietzel.github.io/google-font-finder/) If you need to get fontkits from google font resources – check also. It provides fine grained search filter options, saving favorites, variable fonts axis removal and many other features.

### Alternatives (for fontkit creation)
* [google-webfonts-helper](https://gwfh.mranftl.com/fonts) – focused on getting google fonts kits. Supports also legacy formats like `.eot` and `.svg`
* [Fontsource](https://fontsource.org/) – includes also some other Open source font libraries and an API
* [Fontsquirrel Webfont Generator](https://www.fontsquirrel.com/tools/webfont-generator) – creates fontkits from uploaded font files with adjustment options (e.g subsetting, hinting, vertical metrics)
* [Transfonter](https://transfonter.org/) – mainly a font format converter. Handy if you need to convert older files to modern `woff2`. It also comes with a `@font-face` generator.