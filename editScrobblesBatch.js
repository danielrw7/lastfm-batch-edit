const $ = jQuery
async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms))
}
async function editScrobble(form, newAttributes = {}) {
    const $form = $(form)
    $form.find('button').click()
    await sleep(2000)
    Object.entries(newAttributes).forEach(([key, value]) => {
        $('#id_' + key).val(value)
    })
    $('.modal-body [type="submit"]').click()
}
async function editScrobblesBatch(newAttributes = {}) {
    const forms = $('[action*="/library/edit"]').toArray()
    for (let form of forms) {
        await editScrobble(form, newAttributes)
        await sleep(1000)
    }
}

editScrobblesBatch({
    track_name: 'New Track',
    // artist_name: 'New Artist',
    // album_name: 'New Album',
    // album_artist_name: 'New Album Artist',
})