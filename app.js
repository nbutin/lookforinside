function _reset() {
    window.prop_version = undefined;
    window.prop_selected = undefined;
    window.prop_sex = 0;
    window.prop_stored = {
        prop_profiles: [],
    };
    window.prop_profiles = [...characters];
}
_reset();


window.embodying_triggers = {
    '^-main(-.*)?$': embodyMain,
    '^-matching-\\d+$': embodyMatching,
    '^-fandoms$': embodyFandoms,
    '^-spec-p-\\d+$': embodySpec,
    '^-edit(-.*)?$': embodyEdit,
    '^-test-s-': embodyTestS,
    '^-test-p-': embodyTestP,
};


document.addEventListener('DOMContentLoaded', () => {
    if (location.search.match(/vk_user_id=(\d+)/)) initVk();
    else if (window.self !== window.top) initBastyon();
    prepareSelectors();
    appLoadProps();
});

function calcSocRating(type_id) {
    if (type_id < 0 || window.prop_profiles[appGetSelected()][1] < 0) return [-1, -1, []];
    const selected = soc_types[window.prop_profiles[appGetSelected()][1]];
    const tested = soc_types[type_id];
    var n1 = 0;
    var r = 0;
    var comment = {};
    var txt_comment = [];
    tested[2].split('').slice(0, 2).forEach(i => {
        n1 += 1;
        let n2 = selected[2].indexOf(i) + 1;
        let k = [n1, n2].sort().join('');
        if (k in soc_scale) {
            r += soc_scale[k][0];
            if (!(soc_scale[k][1] in comment)) {
                comment[soc_scale[k][1]] = [];
            }
            comment[soc_scale[k][1]].push(soc_areas[i].replace(' ', '&nbsp;'));
        }
    });
    var n1 = 0;
    selected[2].split('').slice(0, 2).forEach(i => {
        n1 += 1;
        let n2 = tested[2].indexOf(i) + 1;
        let k = [n1, n2].sort().join('');
        if (k in soc_scale) {
            r += soc_scale[k][0];
            if (!(soc_scale[k][1] in comment)) {
                comment[soc_scale[k][1]] = [];
            }
            if (!comment[soc_scale[k][1]].includes(soc_areas[i].replace(' ', '&nbsp;'))) {
                comment[soc_scale[k][1]].push(soc_areas[i].replace(' ', '&nbsp;'));
            }
        }
    });
    var order = [];
    Object.values(soc_scale).sort((a, b) => b[2] - a[2]).forEach(i => {order.push(i[1])});
    Object.keys(comment).sort((a, b) => order.findIndex(x => x == a) - order.findIndex(x => x == b)).forEach(k => {
        txt_comment.push(`${k} по&nbsp;${comment[k].join(" и ")}`);
    });
    var result = parseInt(((r + 26) / 52) * 100);
    return [result, result, txt_comment];
}

function calcPsyRating(type_id) {
    if (type_id < 0 || window.prop_profiles[appGetSelected()][2] < 0) return [-1, -1, []];
    const selected = psy_types[window.prop_profiles[appGetSelected()][2]];
    const tested = psy_types[type_id];
    var n1 = 0;
    var r = 0;
    var comment = {};
    var txt_comment = [];
    tested[0].split('').forEach(i => {
        n1 += 1;
        let n2 = selected[0].indexOf(i) + 1;
        let k = [n1, n2].sort().join('');
        if (k in psy_scale) {
            r += psy_scale[k][0];
            if (!(psy_scale[k][1] in comment)) {
                comment[psy_scale[k][1]] = [];
            }
            comment[psy_scale[k][1]].push(psy_areas[i]);
        }
    });
    var order = [];
    Object.values(psy_scale).sort((a, b) => b[2] - a[2]).forEach(i => {order.push(i[1])});
    Object.keys(comment).sort((a, b) => order.findIndex(x => x == a) - order.findIndex(x => x == b)).forEach(k => {
        txt_comment.push(`${k} по&nbsp;${comment[k].join("&nbsp;и&nbsp;")}`);
    });
    var result = parseInt(((r + 12) / 24) * 100);
    return [result, result, txt_comment];
}

function calcRating(profile_id) {
    const soc_rating = calcSocRating(window.prop_profiles[profile_id][1]);
    const psy_rating = calcPsyRating(window.prop_profiles[profile_id][2]);
    const min_rating = parseInt((
        parseInt(soc_rating[0] >= 0 && `${soc_rating[0]}` || 0) +
        parseInt(psy_rating[0] >= 0 && `${psy_rating[0]}` || 0)
    ) / 2);
    const max_rating = parseInt((
        parseInt(soc_rating[1] >= 0 && `${soc_rating[1]}` || 100) +
        parseInt(psy_rating[1] >= 0 && `${psy_rating[1]}` || 100)
    ) / 2);
    return [min_rating, max_rating, soc_rating[0], psy_rating[0], soc_rating, psy_rating, profile_id];
}


function sumRating(numbers) {
    var sum = 0;
    numbers.slice(0, 4).forEach(i => {
        if (i > -1) sum += i;
        else sum += 50;
    });
    return sum;
}


// ok
function calcAllRatings() {
    var map = [];
    const selected = appGetSelected();
    window.prop_profiles.forEach((val, i) => {
        if (val && selected != i && val[3] != window.prop_profiles[selected][3]) {
            map.push(calcRating(i));
        }
    });
    return map.sort((a, b) => (sumRating(b) + b[2] / 1000000) - (sumRating(a) + a[2] / 1000000));
}


function appGetSelected() {
    if (window.prop_selected != undefined && window.prop_profiles[window.prop_selected]) {
        return window.prop_selected;
    } else {
        const selfdeterminated = window.prop_profiles[0] && window.prop_profiles[0][1] + window.prop_profiles[0][1] > -2;
        if (selfdeterminated) {
            return 0;
        } else {
            let profile_id;
            window.prop_profiles.some((v, i) => {
                if (i > 0 && v && v[3] == window.prop_sex) {
                    profile_id = i;
                    return true;
                }
            });
            return profile_id || 1;
        }
    }
}


// ok
function embodyMain() {
    if (!window.prop_sex) {
        location.hash = '-select';
        return;
    }
    const first = calcRating(appGetSelected());
    var items = [first, ...calcAllRatings()];
    items = items;
    var html = '';
    items.forEach((v, i) => {
        const profile = window.prop_profiles[v[6]];
        let sr = `soc${percentToText(v[4][0], v[4][1])}`;
        let pr = `psy${percentToText(v[5][0], v[5][1])}`;
        if (profile && profile[2] in psy_types) {
            var f1 = psy_types[profile[2]][0].slice(0, 1);
            var f2 = psy_types[profile[2]][0].slice(1, 2);
        } else {
            var f1 = 'В';
            var f2 = 'Э';
        }
        f1 = {'Ф': 'P1', 'В': 'V1', 'Э': 'E1', 'Л': 'L1'}[f1];
        f2 = {'Ф': 'P2', 'В': 'V2', 'Э': 'E2', 'Л': 'L2'}[f2];
        if (profile && profile[1] in psy_types) {
            let x = soc_types[profile[1]][2].slice(0, 1);
            if (x == x.toLowerCase()) var ie = 'sI';
            else var ie = 'sE';
            x = soc_types[profile[1]][0].slice(0, 1);
            if ('ис'.includes(x.toLowerCase())) var jp = 'sP';
            else var jp = 'sJ';
        } else {
            var ie = 'sE';
            var jp = 'sJ';
        }
        var url = appStoredImage(v[6]);
        var href = `-matching-${v[6]}`;
        if (i == 0) href = '-select';
        else if (v[6] === undefined) href = '-edit-';
        else if (v[6] === 0 && (profile[1] + profile[2]) > -2) href = '-matching-0';
        else if (v[6] === 0) href = '-edit-0';
        if (!i || v[6] === undefined) var flag = 'sepia';
        else var flag = '';
        html += appBadge(v[6], [sr, pr, f1, f2, ie, jp, flag]).replace('onclick=""', `onclick="location.hash = '${href}'"`);
    });
    document.getElementById('map').innerHTML = html;
    fixLayout();
}


// ok
function appStoredImage(profile_id) {
    if (!window.non_saving_mode) {
        return coreStoredImage(profile_id)
            || (parseInt(profile_id) > 0 && parseInt(profile_id) < 51
            && `images/${profile_id}.jpg`) || '';
    } else {
        return parseInt(profile_id) > 0 && `https://shorewards.ru/psion/static/images/${profile_id}.jpg` || '';
    }
}



// ok
function appBadge(profile_id, modifiers) {
    const image = appStoredImage(profile_id);
    var label = '';
    if (window.prop_profiles[profile_id]) {
        label = coreAcronym(window.prop_profiles[profile_id][0]);
    }
    const featured = modifiers && true || false;
    return coreBadge(image, label, null, featured, modifiers);
}


// ok
function percentToText(n1, n2) {
    if (n1 < 0 || n2 - n1 > 50) return 'none';
    else if (n1 >= 80) return 'best';
    else if (n1 >= 60) return 'good';
    else if (n1 >= 45) return 'norm';
    else if (n1 >= 30) return 'poor';
    else return 'sick';
}


// ok
function getColorMark(text) {
    var result = '';
    Object.entries(marks).some(i => {
        if (i[1].includes(text.split(' ')[0])) {
            result = i[0];
            return true;
        }
    });
    return result;
}


// ok
function formatRatingDetails(items) {
    var html = '';
    items.forEach(i => {
        html += `<li class="${getColorMark(i)}-marked">✔ ${i.replace(' и ', ' и&nbsp;')},</li>`;
    });
    return html && html.slice(0, -6) + '.</li>' || '';
}


// ok
function embodyMatching() {
    const id1 = appGetSelected();
    const selected = window.prop_profiles[id1];
    const matched = appGetProfileByHash();
    const id2 = matched[9];
    if (id1 == 0) link1e = '-edit-0';
    else if ([1,2,3,4,5,6,7,8,9].includes(id1)) link1e = `-edit-r-${id1}`;
    else link1e = `-edit-w-${id1}`;
    if (id2 == 0) link2e = '-edit-0';
    else if ([1,2,3,4,5,6,7,8,9].includes(id2)) link2e = `-edit-r-${id2}`;
    else link2e = `-edit-w-${id2}`;
    var link1s = `-spec-s-${selected[1]}`;
    var link2s = `-spec-s-${matched[1]}`;
    var link1p = `-spec-p-${selected[2]}`;
    var link2p = `-spec-p-${matched[2]}`;
    var url1 = appStoredImage(id1);
    var url2 = appStoredImage(id2);
    var badge1 = coreBadge(url1, selected[0], `location.hash = '${link1e}'`);
    var badge2 = coreBadge(url2, matched[0], `location.hash = '${link2e}'`);
    const rating = calcRating(id2);
    if (rating[0] == rating[1]) var sum_percent = rating[0];
    else var sum_percent = `от ${rating[0]} до ${rating[1]}`;
    if (rating[4][0] > -1) var soc_percent = rating[4][0] + '%';
    else var soc_percent = 'неизвестно';
    if (rating[5][0] > -1) var psy_percent = rating[5][0] + '%';
    else var psy_percent = 'неизвестно';
    var sum_rating = percentToText(rating[0], rating[1]);
    var soc_rating = percentToText(rating[4][0], rating[4][1]);
    var psy_rating = percentToText(rating[5][0], rating[5][1]);
    var soc_details = formatRatingDetails(rating[4][2]);
    var psy_details = formatRatingDetails(rating[5][2]);
    document.getElementById('sum-percent').innerText = sum_percent;
    var html = `
        <tr class="${sum_rating}">
            <td>${badge1}</td>
            <td>${badge2}</td>
        </tr>
        <tr>
            <td colspan="2">
                <h3>По социотипу — ${soc_percent}</h3>
            </td>
        </tr>
        <tr class="${soc_rating}">
            <td>
                <div><button onclick="location.hash = '${selected[1] >= 0 && link1s || link1e}'">${selected[1] >= 0 && soc_types[selected[1]][1] || '&nbsp; ? &nbsp;'}</button></div>
            </td>
            <td>
                <div><button onclick="location.hash = '${matched[1] >= 0 && link2s || link2e}'">${matched[1] >= 0 && soc_types[matched[1]][1] || '&nbsp; ? &nbsp;'}</button></div>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <ul id="soc-details">
                    ${soc_details}
                </ul>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <h3>По психотипу — ${psy_percent}</h3>
            </td>
        </tr>
        <tr class="${psy_rating}">
            <td>
                <div><button onclick="location.hash = '${selected[2] >= 0 && link1p || link1e}'">${selected[2] >= 0 && psy_types[selected[2]][1] || '&nbsp; ? &nbsp;'}</button></div>
            </td>
            <td>
                <div><button onclick="location.hash = '${matched[2] >= 0 && link2p || link2e}'">${matched[2] >= 0 && psy_types[matched[2]][1] || '&nbsp; ? &nbsp;'}</button></div>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <ul id="psy-details">
                    ${psy_details}
                </ul>
            </td>
        </tr>
        <tr>
            <td>
                <button onclick="location.hash = '${link1e}'">Исправить</button>
            </td>
            <td>
                <button onclick="location.hash = '${link2e}'">Исправить</button>
            </td>
        </tr>
    `;
    document.querySelector('#matching table').innerHTML = html;
    fixLayout();
}


// ok
function embodySpec(type_id) {
    var type = psy_types[type_id || location.hash.split('-').slice(-1)[0]];
    document.querySelector('.-spec-p h3').innerText = `${type[1]} (${type[0]})`;
    document.querySelectorAll('.-spec-p strong').forEach((node, i) => {
        node.innerText = functions[type[0][i]];
    });
    fixLayout();
}


// ok
function appGetProfileByHash() {
    const profile_id = parseInt(location.hash.split('-').slice(-1)[0]);
    const profile = [...(window.prop_profiles[profile_id] || ['', -1, -1])];
    profile[9] = profile_id;
    return profile;
}


// 
function fromCacheOrProfile(index) {
    const profile = appGetProfileByHash();
    const cached = appCachedProfileValue(index);
    if (index == 8) {
        return cached || coreStoredImage(profile[9]) || `images/${profile[9]}.jpg`;
    } else {
        if (cached != undefined) {
            return cached;
        } else {
            return profile[index];
        }
    }
}


// ok
function appCachedProfileValue(i, value) {
    if (!window._cached_ || [undefined].includes(i)) {
        window._cached_ = [];
    }
    if (value !== undefined) {
        window._cached_[i] = value;
    } else {
        return window._cached_[i];
    }
}

// ok
function embodyEdit() {
    if (core_history_of_embodyings[1].slice(0, 6) != '-test-') {
        appCachedProfileValue();
    }
    const profile = appGetProfileByHash();
    const [input_name, soc_selector, psy_selector] = document.querySelectorAll('.-edit input[name="name"], .-edit select');
    const [soc_hint, psy_hint] = document.querySelectorAll('.-edit.hint div');
    const image = document.getElementById('badge-place');
    image.style.height = `${image.offsetHeight}px` 
    const button = document.querySelector('.-edit button');
    input_name.disabled = false;
    soc_selector.disabled = false;
    psy_selector.disabled = false;
    soc_hint.innerHTML = '';
    soc_hint.parentNode.hidden = true;
    psy_hint.innerHTML = '';
    psy_hint.parentNode.hidden = true;
    input_name.value = fromCacheOrProfile(0);
    soc_selector.value = fromCacheOrProfile(1);
    changedProfile(soc_selector.name, soc_selector.value);
    psy_selector.value = fromCacheOrProfile(2);
    changedProfile(psy_selector.name, psy_selector.value);
    image.innerHTML = coreBadge(fromCacheOrProfile(8), input_name.value);
    if (profile[9] === 0) {
        input_name.disabled = true;
    } else if ('1 2 3 4 5 6 7 8 9'.includes(profile[9])) {
        soc_selector.disabled = true;
        psy_selector.disabled = true;
    }
    button.innerText = 'Сохранить'
    button.disabled = true;
    fixLayout();
}


// ok
function prepareSelectors() {
    const [soc_selector, psy_selector] = document.querySelectorAll('.-edit select');
    var items = [
        '<option value="-1">Социотип ( ? )</option>', 
        '<option value="test">Определить с помощью теста...</option>',
    ];
    soc_types.forEach((v, i) => {
        items.push(`<option value="${i}">${v[0]}, ${v[1]}</option>`);
    });
    soc_selector.innerHTML = items.join('\n');
    items = [
        '<option value="-1">Психотип ( ? )</option>',
        '<option value="test">Определить с помощью теста...</option>',
    ];
    psy_types.forEach((v, i) => {
        items.push(`<option value="${i}">${v[0]}, ${v[1]}</option>`);
    });
    psy_selector.innerHTML = items.join('\n');
}


// ok
function changedProfile(name, value) {
    name = name || event.target.name;
    value = value || event.target.value;
    const profile = appGetProfileByHash();
    const edited = getEditedProfileValues();
    const button = document.querySelector('.-edit button');
    if (name != 'name' && value == 'test') {
        location.hash = `${name}-${profile[9]}`;
        return;
    }
    if (name == 'name' && value == '-reset') {
        localStorage.clear();
        for (k in window.prop_stored) {
            delete window[k];
        }
        _reset();
        location.hash = '';
        return;
    }
    setTimeout(() => {
        if ((profile[0] || edited[0]) && edited.toString() != profile.toString()) {
            button.disabled = false;
        } else {
            button.disabled = true;
        }
        const hints = document.querySelectorAll('.-edit.hint div');
        if (name == 'name') {
            let input_name = document.querySelector('.-edit input[name="name"]');
            input_name.value = value.replaceAll(/[<>]|^\s+$/g, '');
            if (!input_name.value && profile[0]) button.innerText = 'Удалить';
            else button.innerText = 'Сохранить';
            let image = document.getElementById('badge-place');
            let image_url = image.querySelector('a[style]').style.backgroundImage.slice(5, -2);
            image.innerHTML = coreBadge(image_url, value);
            appCachedProfileValue(0, value);
        } else if (name.split('-').slice(-1)[0] == 's') {
            if (parseInt(value) >= 0) {
                hints[0].innerHTML = document.querySelector(`.-spec-s-${value}`).innerHTML;
                hints[0].parentNode.hidden = false;
            } else {
                hints[0].innerHTML = '';
                hints[0].parentNode.hidden = true;
            }
        } else if (name.split('-').slice(-1)[0] == 'p') {
            if (parseInt(value) >= 0) {
                embodySpec(value);
                hints[1].innerHTML = document.querySelector('.-spec-p:not(.header)').innerHTML;
                hints[1].parentNode.hidden = false;
            } else {
                hints[1].innerHTML = '';
                hints[1].parentNode.hidden = true;
            }
        }
    fixLayout();
    }, 1);
}


// 
function getEditedProfileValues() {
    const [input_name, soc_selector, psy_selector] = document.querySelectorAll('.-edit input[name="name"], .-edit select');
    const values = [input_name.value.replaceAll(/^\s+$/g, ''), parseInt(soc_selector.value), parseInt(psy_selector.value)];
    values[9] = appGetProfileByHash()[9];
    return values;
}


// ok
function saveProfile() {
    const values = getEditedProfileValues();
    var ok = true;
    window.prop_profiles.some((val, i) => {
        if (val && val[0] == values[0] && i != values[9]) {
            ok = confirm('Профиль с таким именем уже существует. Продолжить сохранение?');
            return true;
        }
    });
    if (!ok) return;
    if ([NaN].includes(values[9])) {
        coreStoredImage(window.prop_profiles.length, appCachedProfileValue(8));
        window.prop_profiles.push(values.slice(0, 3));
        history.back();
    } else if (!values[0]) {
        window.prop_profiles[values[9]] = null;
        while (window.prop_profiles.length > 10 && !window.prop_profiles.slice(-1)[0]) {
            window.prop_profiles.pop();
        }
        coreStoredImage(values[9], null);
        location.hash = '-main';
    } else {
        window.prop_profiles[values[9]] = values.slice(0, 3);
        coreStoredImage(values[9], appCachedProfileValue(8));
        history.back();
    }
    appSaveProps('prop_profiles');
}



function toStorage(key, val) {
    localStorage[key] = JSON.stringify(val);
}

function selectFile() {
    document.getElementById('uploaded').click();
}



// ok
function applyImage() {
    const file = document.getElementById('uploaded').files[0];
    if (!['image/jpeg', 'image/gif', 'image/svg+xml', 'image/png'].includes(file.type)) {
        alert('Неверный тип файла.\nПодойдут: png, jpeg, svg и gif');
        return;
    }
    const url = URL.createObjectURL(file);
    compressImage(url, data => {
        appCachedProfileValue(9, appGetProfileByHash()[9]);
        appCachedProfileValue(8, data);
        const image = document.querySelector('.-edit .badge a[style]');
        image.style.backgroundImage = `url('${data}')`;
        const input_name = document.querySelector('.-edit input[name="name"]');
        if (input_name.value) {
            const button = document.querySelector('.-edit button');
            button.disabled = false;
        }
    });
}


// ok
function compressImage(url, callback) {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    const img = new Image;
    img.onload = function() {
        ctx.drawImage(img, 0, 0, 240, 240);
        [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].some(x => {
            let result = canvas.toDataURL('image/jpeg', x);
            if (result.length <= 50 * 1024) {
                callback(result);
                return true;
            }
        });
    }
    img.src = url;
}



function coreStoredImage(id, data) {
    const name = `image-${id}`;
    if (data === undefined) {
        return window[name];
    } else if (data === null) {
        delete window[name];
        delete window.prop_stored[name];
        appSaveProps([name, 'prop_stored']);
    } else {
        window[name] = data;
        window.prop_stored[name] = '';
        appSaveProps([name, 'prop_stored']);
    }
}



function altMain() {
    if (location.hash == '#-main') {
        if ([154174327, 92610625].includes(parseInt(window.vk_user_id))) {
            location.hash = '-fandoms';
        } else {
            location.hash = '-select';
        }
    } else {
        location.hash = '-main';
    }
}


// ok
function embodyTestS() {
    document.querySelector('.-test-s button:first-of-type').disabled = true;
    document.querySelectorAll('.-test-s input[type="radio"]').forEach(node => {
        node.checked = false;
        if (!node.onchange) {
            node.onchange = checkTestS;
        }
    });
}


function checkTestS() {
    var checked = 0;
    document.querySelectorAll('.-test-s input').forEach(node => {
        if (node.checked) checked += 1;
    });
    if (checked == 4) {
        document.querySelector('.-test-s button:first-of-type').disabled = false;
    }
}


// ok
function acceptTestS() {
    const form = document.querySelector('.-test-s form');
    const type_code = `${form.EI.value}${form.NS.value}${form.TF.value}${form.JP.value}`;
    appCachedProfileValue(9, appGetProfileByHash()[9]);
    soc_types.forEach((v, i) => {
        if (v[3] == type_code) appCachedProfileValue(1, i);
    });
    history.back();
}


function embodyTestP() {
    const units = document.getElementsByClassName('-test-p');
    units[2].querySelector('button').disabled = true;
    units[1].querySelectorAll('input[type="radio"]').forEach(node => {
        node.checked = false;
        node.removeAttribute('data-checked');
        if (!node.onchange) {
            node.onchange = checkTestP;
        }
    });
    units[1].querySelectorAll('.step2').forEach(node => {
        node.hidden = true;
    });
    fixLayout();
}



function checkTestP(step) {
    const units = document.getElementsByClassName('-test-p');
    const [form1, form2, form3] = units[1].querySelectorAll('form p');
    const checked1 = form1.querySelectorAll('input[data-checked]');
    const checked2 = form2.querySelectorAll('input[data-checked]');
    const checked3 = form3.querySelectorAll('input[data-checked]');
    if (event.target.parentNode.parentNode.childElementCount == 4 && checked1.length > 1) {
        embodyTestP();
    }
    event.target.checked = true;
    event.target.dataset.checked = true;
    if (checked1.length == 1) {
        units[1].querySelectorAll('.step2').forEach(node => {
            node.hidden = false;
            form2.innerText = '';
            form3.innerText = '';
            form1.querySelectorAll('input').forEach(node => {
                let clone = node.parentNode.cloneNode(true);
                if (node.checked) {
                    form3.appendChild(clone);
                } else {
                    form2.appendChild(clone);
                }
                form2.querySelectorAll('input').forEach(node => {
                    node.checked = false;
                    node.removeAttribute('data-checked');
                    node.name = '13';
                    node.onchange = checkTestP;
                });
                form3.querySelectorAll('input').forEach(node => {
                    node.checked = false;
                    node.removeAttribute('data-checked');
                    node.name = '24';
                    node.onchange = checkTestP;
                });
            });
        });
        fixLayout();
    } else if (event.target.name == '13' && checked2.length) {
        form2.querySelectorAll('input').forEach(node => {
            if (node.value != event.target.value) {
                node.checked = false;
                node.removeAttribute('data-checked');
            } 
        });
    } else if (event.target.name == '24' && checked3.length) {
        form3.querySelectorAll('input').forEach(node => {
            if (node.value != event.target.value) {
                node.checked = false;
                node.removeAttribute('data-checked');
            } 
        });
    }
    if (units[1].querySelectorAll('input[data-checked]').length == 4) {
        units[2].querySelector('button').disabled = false;
    }
}


// ok
function acceptTestP() {
    const [f13, f24] = document.querySelectorAll('.-test-p form:not(:first-of-type)');
    const f1 = f13.querySelector('[data-checked]');
    const f3 = f13.querySelector('input:not([data-checked])');
    const f2 = f24.querySelector('[data-checked]');
    const f4 = f24.querySelector('input:not([data-checked])');
    const type_code = `${f1.value}${f2.value}${f3.value}${f4.value}`;
    appCachedProfileValue(9, appGetProfileByHash()[9]);
    psy_types.forEach((v, i) => {
        if (v[0] == type_code) {
            appCachedProfileValue(2, i);
        }
    });
    history.back();
}


function visit(name) {
    var map = {
        'default': 'https://bastyon.com/sdrawerohs',
        'webapp': 'https://pogodavdometer.web.app',
        'featured': 'https://bastyon.com/index?video=1&v=888d76fcbe1e28cc25b412d46344fd49e6c69c013743f14f1a52ef066d60bbf2',
        'lexigo': 'https://bastyon.com/application?id=lexigo.app',
        'antimatrix': 'https://bastyon.com/application?id=antimatrix.app',
        'lifetuner': 'https://bastyon.com/application?id=lifetuner.app',
    }
    var vk_map = {
        'default': 'https://vk.com/shorewards',
        'webapp': 'https://pogodavdometer.web.app',
        'featured': 'https://vk.com/shorewards?w=wall-117170606_344',
        'lexigo': 'https://vk.com/lexigo2',
        'antimatrix': 'https://vk.com/antimatriks',
        'lifetuner': 'https://vk.com/progressinator',
    }
    openExternalLink((window.vk_user_id && vk_map || map)[name || 'default']);
}


function setup() {
    if (window.vk_user_id) {
        vkBridge
        .send("VKWebAppRecommend")
        .finally(() => {
            vkBridge
            .send("VKWebAppAddToFavorites")
            .finally(() => {
                vkBridge
                .send("VKWebAppAllowNotifications")
                .finally(() => {
                });
            });
        });
    } else {
        location.hash = '-settings';
    }
}









var _install_prompt;


window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _install_prompt = e;
});


function install(){
    if (_install_prompt){
        _install_prompt.prompt();
        _install_prompt.userChoice.then(r => {
            if (r.outcome === 'accepted') {
                log('Installation accepted');
                alert('Приложение установлено :)');
            } else {
                log('Installation refused');
            }
        });
    } else {
        alert('Что-то пошло не так :(');
    }
}


function embodyFandoms() {
    if (!window.fandom_characters) {
        fetch('https://shorewards.ru/psion/read')
        .then(response => response.json())
        .then(data => {
            console.log(data.characters);
            window.fandom_characters = data.characters;
            let html = '';
            data.sources.sort((a,b) => a[1].localeCompare(b[1])).forEach(i => {
                html += `<option value="${i[0]}">${i[1]}</option>`;
            });
            document.getElementById('fandom').innerHTML = html;
        });
    }
}

function applyFandom() {
    window.non_saving_mode = true;
    const characters = [];
    const fandom = document.getElementById('fandom').value;
    window.fandom_characters.filter(i => i[2] == fandom).forEach(i => {
        characters[i[0] - 1] = [i[1], i[3], i[4]];
    });
    window.prop_profiles = [window.prop_profiles[0], ...characters];
    location.hash = '-main';
}


function select(sex) {
    window.prop_sex = sex;
    location.hash = '-main';
}
