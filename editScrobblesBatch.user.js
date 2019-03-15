// ==UserScript==
// @name        lastfm-batch-edit
// @version     0.1
// @author      https://github.com/danielrw7
// @description Edit all scrobbles on a page on last.fm
// @include     https://*.last.fm/*
// @include     https://last.fm/*
// @grant       window.eval
// ==/UserScript==

window.eval(`
async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms))
}
const waitMaxTries = 100
async function waitForPopup(open) {
    for (let tries = 0; tries < waitMaxTries; tries++) {
        await sleep(100)
        if (open === !!(jQuery('.modal-dialog').length)) {
            break
        }
    }
}
async function editScrobble(form, newAttributes = {}) {
    const $form = jQuery(form)
    $form.find('button').click()
    await waitForPopup(true)
    Object.entries(newAttributes).forEach(([key, value]) => {
        jQuery('#id_' + key).val(value)
        $form.find(\`[name = "\${key}"]\`).val(value)
    })
    jQuery('.modal-body [type="submit"]').click()
    await waitForPopup(false)
}
function scrobbleHasChange(form, newAttributes = {}) {
    const $form = jQuery(form)
    for (let attribute of Object.entries(newAttributes)) {
        const [key, value] = attribute
        if ($form.find(\`[name = "\${key}"]\`).val() !== value) {
            return true
        }
    }
    return false
}
function getNumPages() {
    return parseInt(jQuery('.pagination-list > .pagination-page:nth(-1)').text().trim())
}
function getCurrentPage() {
    return parseInt(jQuery('.pagination-list > [aria-current="page"]').text().trim())
}
async function setPage(n) {
    const currentPage = getCurrentPage()
    if (!currentPage || currentPage === n) {
        return
    }
    console.log('setting page to', n)
    jQuery(\`[href$="?page=\${n}"]:first\`).click()
    for (let tries = 0; tries < waitMaxTries; tries++) {
        await sleep(100)
        if (jQuery('.loading-indicator-loading').length) {
            break
        }
    }
    for (let tries = 0; tries < waitMaxTries; tries++) {
        await sleep(100)
        if (!jQuery('.loading-indicator-loading').length) {
            break
        }
    }

    // The event listeners on the hidden forms are not initialized for an unknown amount of time after the page is done loading
    await sleep(1000)
    console.log('page is now', getCurrentPage() || 1)
}
let editScrobblesBatchInProgress = false
async function editScrobblesBatch(newAttributes = {}) {
    if (editScrobblesBatchInProgress) {
        alert("There is a batch edit already in progress, canceling")
    }
    if (!confirm(labelFromAttributes(newAttributes) + "\\n\\nContinue?")) {
        return
    }
    editScrobblesBatchInProgress = true
    const lastPage = getNumPages() || 1
    for (let page = lastPage; page >= 1; page--) {
        await setPage(page)
        const forms = jQuery('[action*="/library/edit"]').toArray().filter((form) => {
            return scrobbleHasChange(form, newAttributes)
        })
        for (let form of forms) {
            await editScrobble(form, newAttributes)
        }
    }
    if (confirm('Batch edit completed!\\n\\nReload?')) {
        window.location.reload()
        return
    }
    editScrobblesBatchInProgress = false
}
function getAttributesFromModal() {
    const res = {}
    jQuery('.modal-body input[type=text]:visible').toArray().forEach((input) => {
        res[input.name] = input.value
    })
    return res
}
function labelFromAttributes(newAttributes) {
    const res = []
    return Object.entries(newAttributes).map(([key, value]) => {
        return \`\${key.split('_').slice(0, -1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}: \${value}\`
    }).join('\\n')
}
function injectButton() {
    injectCSS()
    const $cancel = jQuery('.modal-body .js-close')
    const $applyToAll = $cancel.clone()
    $applyToAll.text('Apply To All')
    $applyToAll.addClass('apply-to-all')
    $applyToAll.css({
        color: 'white',
    })
    $applyToAll.click(function(e) {
        e.preventDefault()
        editScrobblesBatch(getAttributesFromModal())
        return false
    })
    $applyToAll.insertBefore($cancel)
}

let injectedCSS = false
function injectCSS() {
    if (injectedCSS) {
        return
    }
    var css = \`
        .apply-to-all {
            color: white;
            background-color: rgb(34, 34, 34);
        }
        .apply-to-all:hover {
            color: white;
            background-color: rgb(20, 20, 20) !important;
        }
    \`;
    var style = document.createElement('style');

    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    document.getElementsByTagName('head')[0].appendChild(style);
    injectedCSS = true
}
function init() {
    jQuery('body').on('click', '[action*="/library/edit"] button:not(.js-close)', async function() {
        if (jQuery(this).closest('.modal-body').length) {
            return
        }
        if (editScrobblesBatchInProgress) {
            return
        }
        await waitForPopup(true)
        injectButton()
    })
}
if (window.jQuery) {
    init()
} else {
    window.onload = init
}
`)
