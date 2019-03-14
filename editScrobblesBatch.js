const $ = jQuery
async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms))
}
const waitForPopupMaxTries = 100
async function waitForPopup(open) {
    for (let tries = 0; tries < waitForPopupMaxTries; tries++) {
        await sleep(100)
        if (open === !!($('.modal-dialog').length)) {
            break
        }
    }
}
async function editScrobble(form, newAttributes = {}) {
    const $form = $(form)
    $form.find('button').click()
    await waitForPopup(true)
    Object.entries(newAttributes).forEach(([key, value]) => {
        $('#id_' + key).val(value)
        $form.find(`[name="${key}"]`).val(value)
    })
    $('.modal-body [type="submit"]').click()
    await waitForPopup(false)
}
function scrobbleHasChange(form, newAttributes = {}) {
    const $form = $(form)
    for (let attribute of Object.entries(newAttributes)) {
        const [key, value] = attribute
        if ($form.find(`[name="${key}"]`).val() !== value) {
            return true
        }
    }
    return false
}
async function editScrobblesBatch(newAttributes = {}) {
    const forms = $('[action*="/library/edit"]').toArray().filter((form) => {
        return scrobbleHasChange(form, newAttributes)
    })
    for (let form of forms) {
        await editScrobble(form, newAttributes)
    }
}

editScrobblesBatch({
    track_name: 'New Track',
    // artist_name: 'New Artist',
    // album_name: 'New Album',
    // album_artist_name: 'New Album Artist',
})
