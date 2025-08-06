var core_history_of_embodyings = ['', '', ''];

document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
        .then(() => {
            console.log('Service Worker Registered');
        });
    }
    location.hash = '-main';
    window.addEventListener('hashchange', embody);
});


function embody(){
    var hash = location.hash.slice(1) || '-main';
    console.log('embodied', hash);
    document.querySelectorAll(':is(div, button).part-of').forEach(node => {
        let context = hash;
        while (context) {
            if (node.classList.contains(context)) {
                node.hidden = false;
                break;
            }
            context = context.split('-').slice(0, -1).join('-');
        }
        if (!context) {
            node.hidden = true;
        }
    });
    scroll(0, 0);
    core_history_of_embodyings.unshift(hash);
    core_history_of_embodyings = core_history_of_embodyings.slice(0, 5);
    Object.entries(window.embodying_triggers || {}).forEach(i => {
        if (hash.match(new RegExp(i[0]))) i[1]();
    });
    fixLayout();
}


function fixLayout() {
    if (window.vk_user_id) {
        vkBridge.send("VKWebAppScroll", {top: 0});
        vkBridge.send('VKWebAppResizeWindow', {
            width: 640,
            height: Math.max(document.body.offsetHeight + 96, 640),
        });
    }
}



function coreGetSuiteParam() {
    var param = coreGetSuiteParamsAll().slice(-1)[0];
    if (parseFloat(param) == param) {
        return parseFloat(param);
    } else {
        return param;
    }
}


function coreGetSuiteParamsAll() {
    return location.hash.slice(1).split('-');
}


// ok
function coreAcronym(name) {
    var name = name && `${name}`.split(' ') || [''];
    var abbr = '';
    if (name.length > 1) name.forEach(i => {abbr += i[0] && [...i][0].toUpperCase() || ''});
    return abbr.slice(0, 3) || ([...name[0] || '']).slice(0, 3).join('');
}

function embedded(scheme) {
    var tag = scheme.shift();
    if (!scheme.length) return `<${tag}></${tag}>`;
    else return `<${tag}>${embedded(scheme)}</${tag}>`;
}

function coreBadge(image, label, onclick, featured, modifiers) {
    onclick = onclick && onclick.replaceAll('"', "'");
    featured = featured && typeof(featured) != 'string' && 'buai' || featured || 'ai';
    modifiers = typeof(modifiers) == 'string' && modifiers.trim().split(/\s+/) || modifiers;
    var html = `<b class="badge${modifiers && ' ' + modifiers.join(' ') || ''}">${embedded(featured.split(''))}</b>`;
    html = html.replace('<i></i>', `<i>${coreAcronym(label) || '?'}</i>`);
    html = html.replace('</a>', `</a><a style="background-image:url('${image || ''}')" onclick="${onclick || ''}"><b></b></a>`);
    return html;
}


// OK
function initVk() {
    vkBridge
    .send('VKWebAppInit')
    .then(data => {
        console.log('vkBridge.VKWebAppInit returns', data)
        if (!data.result) throw new Error();
        console.log('vkBridge initialized');
        document.body.classList.add('-vk');
        window.vk_user_id = 
            location.search.match(/vk_user_id=(\d+)/)[1];
        window.vk_is_recommended = 
            location.search.includes('vk_is_recommended=1');
        window.vk_are_notifications_enabled = 
            location.search.includes('vk_are_notifications_enabled=1');
        window.vk_is_favorite = 
            location.search.includes('vk_is_favorite=1');
        _loadPropsVk();
    })
    .catch(error => {
        console.error(error);
    });
}


function initBastyon() {
    window.sdk = new BastyonSdk();
    sdk.init().then((obj) => {
        console.log('bastyon sdk initialized');
        sdk.emit('loaded');
    });
}

function openExternalLink(url) {
    if (window.vk_user_id || !window.sdk || !window.sdk.applicationInfo) {
        openLinkInNewWindow(url);
    } else {
        window.sdk.openExternalLink(url)
        .catch(() => {
            window.sdk.permissions.request(['externallink'])
            .then(() => {
                window.sdk.openExternalLink(url);
            })
            .catch(() => {
                window.sdk.helpers.opensettings();
            });
        });
    }
}


function openLinkInNewWindow(href) {
    var a = document.createElement('a');
    a.href = href;
    a.setAttribute('target', '_blank');
    a.click();
}


















function updateProps(props) {
    // Если загружаемая версия выше, то присваиваем prop_stored и все её аттрибуты объекту window,
    // при условии, что тип их содержимого не противоречит заявленному в prop_stored
    const actual_version = window.prop_version;
    if (!props.prop_version || props.prop_version <= actual_version) {
        if (!window.prop_version) {
            window.prop_version = 1;
            console.log(`embodied with initial props`);
            embody();
        } else {
            console.log(`actual version of props - ${actual_version}, loaded version - ${props.prop_version}`);
            fixLayout();
        }
    } else if (props.prop_stored && props.prop_stored.toString() == "[object Object]") {
        window.prop_version = props.prop_version;
        window.prop_stored = props.prop_stored;
        for (let name in props) {
            if (name in props.prop_stored && typeof(props.prop_stored[name]) == typeof(props[name])) {
                window[name] = props[name];
            }
        }
        console.log(`props version updated from '${actual_version}' to ${window.prop_version}`);
        embody();
    }
}


function appLoadProps() {
    _loadPropsLocal();
}


function _loadPropsLocal() {
    const props = {};
    const prop_stored = JSON.parse(localStorage['prop_stored'] || 'null');
    for (name in {prop_version: 0, prop_stored: {}, ...(prop_stored  || {})}) {
        if (!['undefined', 'NaN'].includes(localStorage[name])) {
            props[name] = JSON.parse(localStorage[name] || 'null');
        }
    }
    updateProps(props);
}


function _loadPropsVk() {
    if (!window.vk_user_id) return;
    const props = {};
    vkBridge
    .send("VKWebAppStorageGet", {"keys": ['prop_version', 'prop_stored']})
    .then(pre => {
        pre.keys.forEach(obj => {
            props[obj.key] = JSON.parse(obj.value);
        });
        vkBridge
        .send("VKWebAppStorageGet", {"keys": Object.keys(props.prop_stored).filter(i => i.slice(0, 5) == 'prop_')})
        .then(data => {
            data.keys.forEach(obj => {
                props[obj.key] = JSON.parse(obj.value);
            });
            updateProps(props);
        });
    });
}


function appSaveProps(list) {
    window.prop_version += 1;
    list = typeof(list) == 'object' && list.length && list
        || typeof(list) == 'string' && [list]
        || Object.keys(window.prop_stored  || {});
    list = ['prop_version', 'prop_stored', ...list];
    if (!window.non_saving_mode) {
        _savePropsLocal(list);
        _savePropsVk(list.filter(name => name.slice(0, 5) == 'prop_'));
    }
}


function _savePropsLocal(list) {
    list.forEach(name => {
        localStorage[name] = JSON.stringify(window[name]);
        console.log(`${name} stored locally`);
    });
}


function _savePropsVk(list) {
    if (!window.vk_user_id) return;
    const vk_limit = 4096;
    const props = {};
    var ok = true;
    list.forEach(name => {
        let value = JSON.stringify(window[name]);
        if (new Blob([value]).size <= vk_limit) {
            props[name] = value;
        } else {
            ok = false;
        }
    });
    if (ok) {
        for (let k in props) {
            vkBridge
            .send("VKWebAppStorageSet", {key: k, value: props[k]});
            console.log(`${name} sent to vk storage`);
        }
    }
}


