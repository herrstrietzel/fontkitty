
/**
 * toggle states
 */

function bindToggleBtns(){
    let btnsToggle = document.querySelectorAll('[data-toggle-class]');
    
    btnsToggle.forEach(btn=>{

        let targetSel = btn.dataset.target;
        let target= document.getElementById(targetSel)
        let toggleClasses = btn.dataset.toggleClasses.split(' ')

        btn.addEventListener('click', (e)=>{
            let current = e.currentTarget;
            let toggleClass = current.dataset.toggleClass;
            let classCurrent = toggleClasses[0]
            let classNext = toggleClasses[1]

            if(toggleClass===toggleClasses[0]){
                classCurrent = toggleClasses[1];
                classNext = toggleClasses[0];
                current.classList.add('active')
                //current.dataset.toggleClass = classCurrent;
                //target.classList.replace(classNext, classCurrent)
            }else {
                classCurrent = toggleClasses[0];
                classNext = toggleClasses[1];
                current.classList.remove('active');
            }
            if( !target.classList.contains(classCurrent) && !target.classList.contains(classNext) ){
                target.classList.add(classNext)
                current.dataset.toggleClass = classNext;
            }else{
                current.dataset.toggleClass = classCurrent;
                target.classList.replace(classNext, classCurrent)
            }
        })
    
    })
}





/**
 * add tools
 */
addtextareaTools();
bindToolbar();

bindToggleBtns();

function addtextareaTools() {
    let textareas = document.querySelectorAll('[data-tools]')

    textareas.forEach(el => {

        let wrap = document.createElement('div')
        wrap.classList.add('wrap-tools', 'pst-rlt')
        el.parentNode.insertBefore(wrap, el)
        let filename = el.dataset.file

        let tools =el.dataset.tools.split(' ')
        let html = `<div class="toolbar-wrap pst-abs btt-0 rgh-0 pdd-0-5em">`;

        tools.forEach(tool=>{
            html += `<button type="button" data-icon="${tool}" class="btn-non btn-toolbar btn-${tool}" title="${tool}"></button>`
        })
      
        html +=`<a href="" class="sr-only link-download" title="download code" download="${filename}"></div>`
        wrap.insertAdjacentHTML('afterbegin', html)
        wrap.append(el);
    })
}

function bindToolbar(){
    let btns = document.querySelectorAll('.btn-toolbar')

    btns.forEach(btn=>{
        let type = btn.classList.contains('btn-copy') ? 'copy' : 'download'

        btn.addEventListener('click', e=>{
            let parent = btn.closest('.wrap-tools')
            let text = parent.querySelector('textarea').value;
            let linkDownload = parent.querySelector('.link-download')
            let mime = linkDownload.getAttribute('download') ? linkDownload.getAttribute('download').split('.').slice(-1)[0] : 'plain'

            let objectUrl = URL.createObjectURL(new Blob([text],  {type:`text/${mime}`}));
            if(type==='copy'){
                navigator.clipboard.writeText(text)
            }

            else if(type==='download'){
                linkDownload.href = objectUrl;
                linkDownload.click()
            }
        })
    })
}
