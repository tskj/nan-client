var currState;

const panes = [   'get_pane'
              ,   'post_pane'
              ,   'put_pane'
              ,   'delete_pane'
              ]   ;

const apiResourcePath = '/api/addressbook';

function $(id) {
    return document.getElementById(id);
}

function setState(state) {

    if (panes.indexOf(state) < 0) {
        return;
    }

    const selectedColor = getComputedStyle(document.querySelector('.inputform')).backgroundColor;
    const normalColor = getComputedStyle(document.querySelector('.menu ul')).backgroundColor;

    $(state).style.backgroundColor = selectedColor;

    panes.forEach( element => {
        if (element === state) {
            return;
        }

        $(element).style.backgroundColor = normalColor;
    });

    $(state).insertBefore($('bar'), $(state).firstChild);
}

function sendRequest() {
    var req = new XMLHttpRequest();
    req.open('GET', apiResourcePath, true);
    req.setRequestHeader('Content-Type', 'application/xml');
	req.onreadystatechange = function() {
        if (req.readyState === XMLHttpRequest.DONE) {
            if (req.status === 200) {
                alert(req.responseText);
            }
        }
    };
    req.send();
}

function initializeState() {
    panes.forEach( pane => {
        $(pane).addEventListener('click', _ => setState(pane), false);
    });

    var pane_selector = document.createElement('div');
    pane_selector.id = 'bar';
    pane_selector.style.backgroundColor = '#3088ff';
    pane_selector.style.position = 'absolute';
    pane_selector.style.width = '100%'
    pane_selector.style.paddingTop = '0px';
    pane_selector.style.paddingBottom = '5px';
    document.body.appendChild(pane_selector);

    setState('get_pane');
}

window.addEventListener('load', initializeState, false);
window.addEventListener('load', _ => {
    $('submit_button').addEventListener('click', sendRequest, false);
}, false);