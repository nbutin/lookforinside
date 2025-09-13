const database_url = 'https://shorewards.ru/walkingpuzzles';

function _reset() {
    window.prop_version = undefined;
    window.prop_sex = 0;
    window.prop_mode = 0;
    window.prop_distance = 5000;
    window.prop_activity = 14;
    window.prop_age = [18, 99];
    window.prop_deleted = [];
    window.prop_cached = {
        prop_sex: 0, // 1, 2
        prop_mode: 0, // 0, 1, 2
        prop_distance: 0,
        prop_activity: 0,
        prop_age: [],
        prop_deleted: [],
    };
    window.prop_stored = {
        prop_profile: [],
    };
    window.prop_profile = [];
    window.prop_profiles = [...characters];
}
_reset();
//~ window.prop_profile = characters_x[1];

window.embodying_triggers = {
    '^main(/.*)?$': embodyMain,
    '^matching/.+$': embodyMatching,
    '^spec-p/.+$': embodySpec,
    '^profile(/.*)?$': embodyProfile,
    '^test-s/.+$': embodyTestS,
    '^test-p/.+$': embodyTestP,
};


document.addEventListener('DOMContentLoaded', () => {
    window.vk_user_id = (location.search.match(/vk_user_id=(\d+)/) || [0, 0])[1];
    if (window.vk_user_id) initVk();
    else if (window.self !== window.top) initBastyon();
    else _loadPropsDb();
    appLoadProps();
    prepareSelectors();
    prepareControls();
});

function calcSocRating(type_id, selected) {
    if (type_id < 0 || window.prop_profiles[Math.abs(appGetSelected())][1] < 0) return [-1, -1, []];
    selected = selected || soc_types[window.prop_profiles[Math.abs(appGetSelected())][1]];
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

function calcPsyRating(type_id, selected) {
    if (type_id < 0 || window.prop_profiles[Math.abs(appGetSelected())][2] < 0) return [-1, -1, []];
    selected = selected || psy_types[window.prop_profiles[Math.abs(appGetSelected())][2]];
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
    const soc_rating = calcSocRating(window.prop_profiles[Math.abs(profile_id)][1]);
    const psy_rating = calcPsyRating(window.prop_profiles[Math.abs(profile_id)][2]);
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


// 
function calcAllRatings() {
    var map = [];
    const selected = appGetSelected();
    window.prop_profiles.forEach((val, i) => {
        if (val && selected != i && val[3] != window.prop_profiles[Math.abs(selected)][3]) {
            map.push(calcRating(i));
        }
    });
    return map.sort((a, b) => (sumRating(b) + b[2] / 1000000) - (sumRating(a) + a[2] / 1000000));
}


function appGetSelected() {
    if (window.prop_profile[9]) {
        return window.prop_profile[9];
    } else {
        let profile_id;
        window.prop_profiles.some(v => {
            if (v && v[3] == window.prop_sex) {
                profile_id = v[9];
                return true;
            }
        });
        return profile_id;
    }
}


function selectMode() {
    const main = document.querySelector('main');
    const node = event.target;
    window.prop_mode = node.value;
    main.querySelector('div').setAttribute('class', node.dataset.color);
    main.querySelectorAll('input[type="text"]').forEach(i => {
        if (node.value == '2') {
            i.disabled = true;
            main.querySelector('button').innerText = 'Применить';
        } else {
            i.disabled = false;
            main.querySelector('button').innerText = 'Найти';
        }
    });
    appKeepProps(node.name);
}

function formatNumbers() {
    const node = event.target;
    var numbers = node.value.match(/\d+/g);
    if (node.name == 'prop_age') {
        numbers = (numbers || []).filter(i => parseInt(i) > 17);
        if (numbers.length) {
            if (numbers.length > 1) {
                window[node.name] = numbers.slice(0, 2).sort((a, b) => a - b);
            } else {
                window[node.name] = [numbers[0], numbers[0]];
            }
        }
    } else {
        if (numbers) {
            window[node.name] = numbers[0];
        }
    }
    node.value = eval(node.dataset.format);
    appKeepProps(node.name);
}

// 
function embodyMain() {
    if (!window.prop_sex) {
        location.hash = 'start';
        return;
    }
    var radio_buttons = document.querySelectorAll('main input[type="radio"]');
    radio_buttons.forEach(node => {
        node.checked = false;
        if (!node.onchange) {
            node.onchange = selectMode;
        }
    });
    radio_buttons[window.prop_mode].click();
    document.querySelectorAll('main input[type="text"]').forEach(node => {
        if (!node.onchange) {
            node.onchange = formatNumbers;
        }
    });
    const first = calcRating(appGetSelected());
    var items = [first, ...calcAllRatings()];
    items = items;
    var html = '';
    const translate = {
        anon: 'none',
        best: 'grow',
        good: 'keep',
        cold: 'know',
        weak: 'pick',
        sick: 'deny',
    };
    items.forEach((v, i) => {
        const profile_id = v[6];
        const profile = window.prop_profiles[Math.abs(profile_id)];
        let sr = translate[percentToText(v[4][0], v[4][1])];
        let pr = percentToText(v[5][0], v[5][1]);
        if (profile && profile[2] in psy_types) {
            var f1 = psy_types[profile[2]][0].slice(0, 1);
            var f2 = psy_types[profile[2]][0].slice(1, 2);
        } else {
            var f1 = 'В';
            var f2 = 'Э';
        }
        f1 = {'Ф': 'P1', 'В': 'V1', 'Э': 'E1', 'Л': 'L1'}[f1];
        f2 = {'Ф': 'P2', 'В': 'V2', 'Э': 'E2', 'Л': 'L2'}[f2];
        if (profile && profile[1] in soc_types) {
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
        var href = `matching/${profile_id}`;
        if (profile_id == appGetSelected()) href = `profile/${profile_id}`;
        const onclick = `location.hash = '${href}'`;
        const image = profile[10];
        const class_a = [sr, pr, f1, f2, ie, jp].join(' ');
        if (!i) var class_b = 'sepia';
        else if (!profile[4] && profile[9] > 0) var class_b = 'shady';
        else var class_b = '';
        const label = profile[0];
        html += htmlBadge(image, label, onclick, class_a, class_b);
    });
    document.getElementById('map').innerHTML = html;
    fixLayout();
}


// 
function appStoredImage(profile_id) {
    if (!window.non_saving_mode) {
        return coreStoredImage(profile_id)
            || (parseInt(profile_id) > 0 && parseInt(profile_id) < 51
            && `images/${profile_id}.jpg`) || '';
    } else {
        return parseInt(profile_id) > 0 && `https://shorewards.ru/psion/static/images/${profile_id}.jpg` || '';
    }
}



// 
function appBadge(profile_id, modifiers) {
    const image = window.prop_profiles[profile_id][6] || appStoredImage(profile_id);
    var label = '';
    if (window.prop_profiles[profile_id]) {
        label = coreAcronym(window.prop_profiles[profile_id][0]);
    }
    const featured = modifiers && true || false;
    return coreBadge(image, label, null, featured, modifiers);
}


// 
function percentToText(n1, n2) {
    if (n1 < 0 || n2 - n1 > 50) return 'anon';
    else if (n1 >= 80) return 'best';
    else if (n1 >= 60) return 'good';
    else if (n1 >= 45) return 'cold';
    else if (n1 >= 30) return 'weak';
    else return 'sick';
}


// 
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


// 
function formatRatingDetails(items) {
    var html = '';
    items.forEach(i => {
        html += `<li class="${getColorMark(i)}-notable">✔ ${i.replace(' и ', ' и&nbsp;')},</li>`;
    });
    return html && html.slice(0, -6) + '.</li>' || '';
}


function correctVerifyHeader(header, status) {
    header.classList.remove('notable-orange');
    header.classList.remove('notable-red');
    header.classList.remove('notable-green');
    if (status == -1) {
        header.innerHTML = '<h2>Герои известных произведений</h2>';
        header.classList.add('notable-orange');
    } else if (status == 1) {
        header.innerHTML = `<h2><a onclick="location.hash = '-verify'" style="background:inherit; color:inherit">Профиль, прошедший проверку</a></h2>`;
        header.classList.add('notable-green');
    } else {
        header.innerHTML = `<h2><a onclick="location.hash = '-verify'" style="background:inherit; color:inherit">Неверифицированный профиль</a></h2>`;
        header.classList.add('notable-red');
    }
}


// 
function embodyMatching() {
    const id1 = appGetSelected();
    const selected = window.prop_profiles[id1];
    const matched = appGetProfileByHash();
    const id2 = matched[9];
    const header = document.querySelector('.-matching.header');
    correctVerifyHeader(header, matched[4]);
    var disabled = '';
    if (matched[4] == -1) disabled = 'disabled="1"';
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
    var url1 = selected[6] || appStoredImage(id1);
    var url2 = matched[6] || appStoredImage(id2);
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
                <button onclick="location.hash = '${link2e}'" class="notable-red" ${disabled}>Удалить</button>
            </td>
        </tr>
    `;
    document.querySelector('#matching table').innerHTML = html;
    fixLayout();
}


// 
function embodySpec(type_id) {
    var type = psy_types[type_id || location.hash.split('-').slice(-1)[0]];
    document.querySelector('[data-name="spec-p"] h3').innerText = `${type[1]} (${type[0]})`;
    document.querySelectorAll('[data-name="spec-p"] strong').forEach((node, i) => {
        node.innerText = functions[type[0][i]];
    });
    fixLayout();
}


// ok
function appGetProfileByHash() {
    const profile_id = parseInt(location.hash.split('/').slice(-1)[0] || window.prop_profile[9] || 0);
    if (profile_id < 0) {
        return [...characters[Math.abs(profile_id)]];
    } else if (!profile_id || profile_id == window.prop_profile[9]) {
        if (window.prop_profile.length) {
            return window.prop_profile;
        } else {
            return ['', -1, -1, window.prop_sex];
        }
    } else {
        let profile;
        window.prop_profiles.some(p => {
            if (p[9] == profile_id) {
                profile = [...p];
                return true;
            }
        });
        return profile;
    }
}


// ok
function fromCacheOrProfile(index) {
    const profile = appGetProfileByHash();
    const cached = appCachedProfileValue(index);
    if (index == 10 && profile[9] >= 0) {
        return `images/${profile[9]}.jpg`;
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
        if (parseInt(value) == value) value = parseInt(value);
        else if (parseFloat(value) == value) value = parseFloat(value);
        window._cached_[i] = value;
    } else {
        return window._cached_[i];
    }
}

// ok
function loadProfileInfo(profile) {
    const section = document.querySelector('[data-name="profile"]');
    if (window.vk_user_id) {
        vkBridge.send('VKWebAppGetUserInfo', { 
            user_ids: `${window.vk_user_id}`, 
        })
        .then(data => {
            console.log(data);
            if (data.id && location.hash.slice(1, 8) == 'profile' && appGetProfileByHash()[9] == profile[9]) {
                let name = `${data.first_name} ${data.last_name}`;
                let url = `https://vk.ru/id${data.id}`;
                appCachedProfileValue(10, data.photo_200);
                appCachedProfileValue(0, name);
                appCachedProfileValue(5, url);
                section.querySelector('[name="name"]').value = name;
                section.querySelector('.badge i').style.backgroundImage = `url("${data.photo_200}")`;
                section.querySelector('[name="link"]').value = url;
            }
        });
    }
}


// 
function embodyProfile() {
    if (core_history_of_embodyings[1].slice(0, 5) != 'test-') {
        appCachedProfileValue();
    }
    const profile = appGetProfileByHash();
    const section = document.querySelector('[data-name="profile"]');
    section.querySelectorAll('.hint>div').forEach(h => {
        h.innerHTML = '';
        h.parentNode.hidden = true;
    });
    const inputs = section.querySelectorAll('input, select');
    const button = section.querySelector('button');
    if (profile[9] == window.prop_profile[9]) {
        loadProfileInfo(profile);
        section.querySelector('[data-part="additional"]').hidden = false;
        section.querySelector('h2').innerText = 'Мой профиль';
        button.innerText = 'Сохранить'
        button.className = 'grow';
        button.disabled = true;
        inputs.forEach(i => {
            i.disabled = false;
        });
    } else {
        button.innerText = 'Удалить'
        button.className = 'deny';
        if (profile[9] < 0) {
            section.querySelector('[data-part="additional"]').hidden = true;
            section.querySelector('h2').innerText = 'Персонаж';
            button.disabled = true;
        } else {
            section.querySelector('[data-part="additional"]').hidden = false;
            section.querySelector('h2').innerText = 'Без верификации';
            button.disabled = false;
        }
        inputs.forEach(i => {
            i.disabled = true;
        });
    }
    const [
        input_name,
        soc_selector,
        psy_selector,
        sex_selector,
        input_link,
        input_location,
        input_year,
        ] = inputs;
    const image = document.getElementById('badge-place');
    input_name.value = fromCacheOrProfile(0);
    const lat = fromCacheOrProfile(7);
    const lon = fromCacheOrProfile(8);
    input_location.value = lat && lon && `${lat}, ${lon}` || '';
    input_year.value = fromCacheOrProfile(6) || '';
    soc_selector.value = fromCacheOrProfile(1);
    changedProfile(0, soc_selector.name, soc_selector.value);
    psy_selector.value = fromCacheOrProfile(2);
    changedProfile(0, psy_selector.name, psy_selector.value);
    sex_selector.value = fromCacheOrProfile(3);
    appCachedProfileValue(3, fromCacheOrProfile(3));
    image.innerHTML = htmlBadge(fromCacheOrProfile(10), input_name.value);
    fixLayout();
}


// 
function prepareSelectors() {
    const [soc_selector, psy_selector] = document.querySelectorAll('[data-name="profile"] select');
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
function isChanged() {
    const profile = appGetProfileByHash();
    if (window._cached_) {
        return window._cached_.some((v, i) => {
            if (v != profile[i]) {
                return true;
            }
        });
    } else {
        return false;
    }
}


// ok
function isComplete() {
    const profile = appGetProfileByHash();
    var result = true;
    for (let i = 0; i < 9; i++) {
        if (i != 4) {
            if (i > 0 && i < 3 && profile[i] < 0 && (!window._cached_ || !window._cached_[i] < 0)) {
                result = false;
            } else if (!profile[i] && (!window._cached_ || !window._cached_[i])) {
                result = false;
            }
        }
    }
    return result;
}

function prepareControls() {
    document.querySelectorAll('[data-name="profile"] select').forEach(c => {
        c.addEventListener('change', changedProfile);
        
    });
    document.querySelectorAll('[data-name="profile"] input').forEach(c => {
        c.addEventListener('keyup', changedProfile);
        c.addEventListener('change', changedProfile);
    });
}


// 
function changedProfile(event, name, value) {
    if (event && event.target.disabled) return;
    name = name || event.target.name;
    value = value || event.target.value;
    console.log(name, value);
    const profile = appGetProfileByHash();
    const section = document.querySelector('[data-name="profile"]');
    const button = section.querySelector('button');
    if (['test-s', 'test-p'].includes(name) && value == 'test') {
        location.hash = `${name}/${profile[9]}`;
        return;
    } else {
        appCachedProfileValue(profile_map.indexOf(name), value);
    }
    setTimeout(() => {
        if (isChanged() && isComplete() && !appCachedProfileValue(0)) {
            //~ button.innerText = 'Удалить';
            //~ button.className = 'deny';
            button.disabled = false;
        } else {
            //~ button.innerText = 'Сохранить';
            //~ button.className = 'grow';
            if (isChanged() && isComplete()) {
                button.disabled = false;
            } else {
                button.disabled = true;
            }
        }
        const hints = section.querySelectorAll('.hint div');
        if (name == 'name') {
            let input_name = section.querySelector('input[name="name"]');
            input_name.value = value.replaceAll(/[<>]|^\s+$/g, '');
            let image = section.querySelector('#badge-place');
            image.innerHTML = htmlBadge(profile[10], value);
        } else if (name == 'year') {
            let input_year = section.querySelector('input[name="year"]');
            let val = Math.abs(parseInt(input_year.value));
            if (!val) {
                input_year.value = '';
            } else if (val != input_year.value) {
                input_year.value = val;
            }
        } else if (name == 'location') {
            let input_location = section.querySelector('input[name="location"]');
            let [lat, lon] = input_location.value.matchAll(/-?\d+\.\d+/g).toArray();
            lat = lat && lat[0];
            lon = lon && lon[0];
            if (lat && lon) {
                appCachedProfileValue(profile_map.indexOf('lat'), lat);
                appCachedProfileValue(profile_map.indexOf('lon'), lon);
                input_location.value = `${lat}, ${lon}`;
            } else {
                input_location.value = '';
            }
            //~ input_name.value = value.replaceAll(/[<>]|^\s+$/g, '');
        } else if (name.split('-').slice(-1)[0] == 's') {
            if (parseInt(value) >= 0) {
                hints[0].innerHTML = document.querySelector(`[data-name="spec-s/${value}"]`).innerHTML;
                hints[0].parentNode.hidden = false;
            } else {
                hints[0].innerHTML = '';
                hints[0].parentNode.hidden = true;
            }
        } else if (name.split('-').slice(-1)[0] == 'p') {
            if (parseInt(value) >= 0) {
                embodySpec(value);
                hints[1].innerHTML = document.querySelector('[data-name="spec-p"] div').innerHTML;
                hints[1].parentNode.hidden = false;
            } else {
                hints[1].innerHTML = '';
                hints[1].parentNode.hidden = true;
            }
        }
        if (['test-s', 'test-p'].includes(name)) {
            fixLayout();
        }
    }, 1);
}


// 
//~ function getEditedProfileValues() {
    //~ const section = document.querySelector('[data-name="profile"]');
    //~ const [
        //~ input_name,
        //~ soc_selector,
        //~ psy_selector,
        //~ sex_selector,
        //~ input_link,
        //~ input_location,
        //~ input_year,
        //~ ] = section.querySelectorAll('input, select');
    //~ const values = [
        //~ input_name.value.replaceAll(/^\s+$/g, ''),
        //~ parseInt(soc_selector.value),
        //~ parseInt(psy_selector.value),
        //~ parseInt(sex_selector.value),
        //~ null, //is_verified
        //~ input_link.value,
        //~ input_year.value,
        //~ input_location.value.split(/,\s*/)[0],
        //~ input_location.value.split(/,\s*/)[1],
        //~ appGetProfileByHash()[9],
        //~ ];
    //~ return values;
//~ }


// 
//~ function saveProfile() {
    //~ const values = getEditedProfileValues();
    //~ var ok = true;
    //~ window.prop_profiles.some((val, i) => {
        //~ if (val && val[0] == values[0] && i != values[9]) {
            //~ ok = confirm('Профиль с таким именем уже существует. Продолжить сохранение?');
            //~ return true;
        //~ }
    //~ });
    //~ if (!ok) return;
    //~ if ([NaN].includes(values[9])) {
        //~ coreStoredImage(window.prop_profiles.length, appCachedProfileValue(8));
        //~ window.prop_profiles.push(values.slice(0, 3));
        //~ history.back();
    //~ } else if (!values[0]) {
        //~ window.prop_profiles[values[9]] = null;
        //~ while (window.prop_profiles.length > 10 && !window.prop_profiles.slice(-1)[0]) {
            //~ window.prop_profiles.pop();
        //~ }
        //~ coreStoredImage(values[9], null);
        //~ location.hash = '-main';
    //~ } else {
        //~ window.prop_profiles[values[9]] = values.slice(0, 3);
        //~ coreStoredImage(values[9], appCachedProfileValue(8));
        //~ history.back();
    //~ }
    //~ appSaveProps('prop_profiles');
//~ }



function toStorage(key, val) {
    localStorage[key] = JSON.stringify(val);
}

function selectFile() {
    document.getElementById('uploaded').click();
}



// 
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


// 
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



function homewards() {
    if (location.hash != '#main') {
        location.hash = 'main';
    } else {
        location.hash = 'start';
    }
}


// 
function embodyTestS() {
    document.querySelector('[data-name="test-s"] button:first-of-type').disabled = true;
    document.querySelectorAll('[data-name="test-s"] input[type="radio"]').forEach(node => {
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


// 
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


// 
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


function start(sex) {
    window.prop_sex = sex;
    appKeepProps('prop_sex');
    location.hash = 'main';
}


//~ function socioPercents() {
    //~ for (let i=0; i<16; i++) {
        //~ for (let j=0; j<16; j++) {
            //~ let percent = calcSocRating(i, soc_types[j])[0];
            //~ document.write(`insert into socio (type1, type2, percent) values (${i}, ${j}, ${percent}); <br/>`);
        //~ }
    //~ }
//~ }
//~ function psychPercents() {
    //~ for (let i=0; i<24; i++) {
        //~ for (let j=0; j<24; j++) {
            //~ let percent = calcPsyRating(i, psy_types[j])[0];
            //~ document.write(`insert into psych (type1, type2, percent) values (${i}, ${j}, ${percent}); <br/>`);
        //~ }
    //~ }
//~ }

function find() {
    const [stype, ptype, sex, x, y, year, lat, lon, id] = window.prop_profile.slice(1);
    const [from_year, to_year] = window.prop_age;
    const is_verified = window.prop_mode;
    const delta = window.prop_distance / 100;
    fetch(`${database_url}/find/${stype}/${ptype}/${sex}/${window.prop_activity}/${from_year}/${to_year}/${lat - delta}/${lat + delta}/${lon - delta}/${lon + delta}/${is_verified}/${deleted}/${id}`)
    .then(response => {
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        window.prop_profiles = data;
        embodyMain();
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function edit() {
    const values = window._cached_;
    const data = {
        name: values[0],
        link: values[5],
        image: values[10],
        params: location.search,
        secret: values[12],
    };
    fetch(`${database_url}/edit/${values[1]}/${values[2]}/${values[3]}/${values[6]}/${values[7]}/${values[8]}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        window.prop_profile[9] = data.id;
        appSaveProps('prop_profile');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}


function saveProfile() {
    // if not vk and not bastion -- do not save profile on server
    edit();
    history.back();
    //~ var ok = true;
    //~ window.prop_profiles.some((val, i) => {
        //~ if (val && val[0] == values[0] && i != values[9]) {
            //~ ok = confirm('Профиль с таким именем уже существует. Продолжить сохранение?');
            //~ return true;
        //~ }
    //~ });
    //~ if (!ok) return;
    //~ if ([NaN].includes(values[9])) {
        //~ coreStoredImage(window.prop_profiles.length, appCachedProfileValue(8));
        //~ window.prop_profiles.push(values.slice(0, 3));
        //~ history.back();
    //~ } else if (!values[0]) {
        //~ window.prop_profiles[values[9]] = null;
        //~ while (window.prop_profiles.length > 10 && !window.prop_profiles.slice(-1)[0]) {
            //~ window.prop_profiles.pop();
        //~ }
        //~ coreStoredImage(values[9], null);
        //~ location.hash = '-main';
    //~ } else {
        //~ window.prop_profiles[values[9]] = values.slice(0, 3);
        //~ coreStoredImage(values[9], appCachedProfileValue(8));
        //~ history.back();
    //~ }
    //~ appSaveProps('prop_profiles');
}
