var _userScrolled = false;
var _fadeOutWasAborted = false;
var nrOfResults = 0;

var currState = '';

var inputFields = [];

const panes = [   'get_pane'
              ,   'post_pane'
              ,   'put_pane'
              ,   'delete_pane'
              ]   ;

const apiResourcePath = '/api/addressbook/';

function $(id) {
    return document.getElementById(id);
}

function setState(state) {

    if (panes.indexOf(state) < 0) {
        return;
    }
    
    currState = state;

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

    switch (state) {
        case 'post_pane':   setPostState();
                            break;
        case 'put_pane':    setPutState();
                            break;
        default:            setSearchState();
    }
}

function setSearchState() {
    $('new_fields_button').className = 'inactive';
    $('ID_selector').className = 'active';
    $('ID_selector').disabled = false;

    inputFields.forEach( form => {
        enableForm(form, false);
    });
}

function setPostState() {
    $('new_fields_button').className = 'active';
    $('ID_selector').className = 'inactive';
    $('ID_selector').disabled = true;

    inputFields.forEach( form => {
        enableForm(form, true);
    });
}

function setPutState() {
    $('new_fields_button').classList = 'inactive';
    $('ID_selector').className = 'active';
    $('ID_selector').disabled = false;

    var firstForm = inputFields[0];
    enableForm(firstForm, true);

    inputFields.forEach( form => {
        if (form !== firstForm) {
            enableForm(form, false);
        }
    });
}

function enableForm(form, enabled) {
    form.forEach( field => {
        field.children[0].disabled = !enabled;
    });
}

function addFormFields(event) {

    if (event.target.className === 'inactive') {
        return;
    }

    var newForm = [];
    inputFields[0].forEach( n => {
        newForm.push(n.cloneNode(true));
    });

    var addAfter = function(n, nn) {
        n.parentNode.insertBefore(nn, n.nextSibling);
    };

    var p = inputFields[inputFields.length-1][inputFields[inputFields.length-1].length-1];
    var newInsertion = document.createElement('br');
    addAfter(p, newInsertion);
    p = newInsertion;

    // add cloned elements to DOM
    newForm.forEach( inputField => {
        inputField.children[0].value = '';
        addAfter(p, inputField);
        p = inputField;
    });

    inputFields.push(newForm);
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function linearAnimate(f, cp, fp, s, finalize) {

    s = (typeof s !== 'undefined') ? s : 1000;
    finalize = (typeof finalize !== 'undefined') ? finalize : _ => {return;};

    const fps = 100;
    const ms = Math.pow(10, 3);

    if (s > 0 && cp > fp || s < 0 && cp < fp) {
        f(fp);
        finalize();
        return;
    }

    cp += s / fps;

    const abort = f(cp);
    if (abort) {
        return;
    }

    setTimeout(_ => {
        linearAnimate(f, cp, fp, s, finalize);
    }, ms / fps);
}

function expDecayAnimate(f, cp, fp, s, finalize) {

    s = (typeof s !== 'undefined') ? s : 10;
    finalize = (typeof finalize !== 'undefined') ? finalize : _ => {return;};

    const d = fp - cp;

    const fps = 100;

    const ms = Math.pow(10, 3);
    const e = 0.001;
    if (Math.abs(d) <= e) {
        finalize();
        return;
    }

    cp += s * d / fps;

    var abort = f(cp);
    if (abort) {
        return;
    }

    setTimeout(_ => {
        expDecayAnimate(f, cp, fp, s, finalize);
    }, ms / fps);
}

function bringStatusIntoView() {

    var scrollDist = window.pageYOffset;
    var windowHeight = window.innerHeight;
    var docHeight = document.body.scrollHeight;

    var pos = $('status').getBoundingClientRect().top;

    var targets = [ windowHeight / 4
                  , windowHeight / 3
                  ] ;

    targets[0] = Math.min(targets[0], pos + scrollDist);
    targets[1] = Math.max(targets[1], windowHeight - docHeight + pos + scrollDist);
    
    var intArgMin = function(f, a, b) {

        if (b < a) {
            return;
        }

        var smallestf = f(a);
        var smallestx = a;

        for (var x = a; x <= b; x++) {
            if (f(x) < smallestf) {
                smallestf = f(x);
                smallestx = x;
            }
        }

        return smallestx;
    };

    var target = targets[intArgMin(x => Math.abs(pos - targets[x]), 0, 1)];

    var distToScroll = pos - target;

    _userScrolled = false;
    expDecayAnimate(interruptibleScrollTo, scrollDist, distToScroll + scrollDist);
}

function createStatusMessage(message, color) {
    switch (color) {
        case 'green': var bg = '#98e3a1';
                      var bc = '#80d090';
                      break;
        default: return;
    }
    var div = document.createElement('div');
    div.className = 'WarningResponse';
    div.id = 'status';
    div.style.backgroundColor = bg;
    div.style.borderColor = bc;
    var innerText = document.createElement('div');
    innerText.innerHTML = message;
    div.appendChild(innerText);
    return div;
}

function interruptibleScrollTo(y) {
    
    if (_userScrolled) {
        _userScrolled = false;
        return true;
    }

    window.scrollTo(window.scrollX, y);

    return false;
}

function interruptibleStatusFadeOut(f) {
    
    return o => {
        if (_fadeOutWasAborted) {
            f(5000);
            $('status').style.opacity = 1;
            $('status').style.filter = 'blur(0px)';
            return true;
        }

        $('status').style.opacity = o;
        o *= -1;
        o++;
        o *= 10;

        $('status').style.filter = 'blur(' + o + 'px)';

        return false;
    }
}

function displayMessage(str, color) {
    // Example text
    str = '<b>Warning</b> Oi da, ikkje alt gjekk etter planen<br>Prøv igjen!';
    color = 'green';
    insertAfter(createStatusMessage(str, color), $('app').firstElementChild);
    expDecayAnimate(x => {$('status').style.opacity = x; return false;}, 0.0, 1.0, 4);
    expDecayAnimate(x => {$('status').style.filter = 'blur(' + x + 'px)'; return false;}, 10.0, 0.0, 8);
    var startFadeOutTimer = time => setTimeout( _ => {
        if (_fadeOutWasAborted) {
            _fadeOutWasAborted = false;
            startFadeOutTimer(time);
            return;
        }

        var currentMargin = parseFloat($('results' + (nrOfResults - 1)).style.marginTop.substring(0, 4));
        var statusMarginTop = window.getComputedStyle($('status')).getPropertyValue('margin-top').substring(0, 2);
        var statusMarginBottom = window.getComputedStyle($('status')).getPropertyValue('margin-bottom').substring(0, 2);
        expDecayAnimate(interruptibleStatusFadeOut(startFadeOutTimer), 1.0, 0.0, 1, _ => expDecayAnimate(x => {
            $('results' + (nrOfResults - 1)).style.marginTop = x;
        }, currentMargin, currentMargin - ($('status').clientHeight + statusMarginTop + statusMarginBottom), 4));
    }, time);
    _fadeOutWasAborted = false;
    startFadeOutTimer(5000);
    $('status').addEventListener('mouseover', _ => _fadeOutWasAborted = true);
    bringStatusIntoView();
}

function sendRequest() {

    var chosenID = $('ID_selector').value;
    if ($('ID_selector').disabled) {
        chosenID = '';
    }

    expDecayAnimate(x => {
        $('submit_button').style.opacity = x;
        return false;
    }, 1, 0, 50);

    var xml = document.implementation.createDocument(null, 'contacts');

    inputFields.forEach( inputForm => {

        if (inputForm[0].children[0].disabled) {
            return;
        }

        var contactNode = xml.createElement('contact');

        var idNode = xml.createElement('id');
        var nameNode = xml.createElement('name');
        var tlfNode = xml.createElement('tlf');

        idNode.appendChild(xml.createTextNode(inputForm[0].children[0].value));
        nameNode.appendChild(xml.createTextNode(inputForm[1].children[0].value));
        tlfNode.appendChild(xml.createTextNode(inputForm[2].children[0].value));

        contactNode.appendChild(idNode);
        contactNode.appendChild(nameNode);
        contactNode.appendChild(tlfNode);

        xml.getElementsByTagName('contacts')[0].appendChild(contactNode);
    });

    var reqVerb = '';

    switch (currState) {
        case 'get_pane':    reqVerb = 'GET';
                            break;
        case 'post_pane':   reqVerb = 'POST';
                            break;
        case 'put_pane':    reqVerb = 'PUT';
                            break;
        case 'delete_pane': reqVerb = 'DELETE';
        default:            return;
    }

    var req = new XMLHttpRequest();
    req.open(reqVerb, apiResourcePath + chosenID, true);
    req.setRequestHeader('Content-Type', 'application/xml');
    req.onreadystatechange = handleResposne(req, reqVerb);
    req.send(xml);
}

function handleResposne(req, reqVerb) {
    return _ => {
        if (req.readyState === XMLHttpRequest.DONE) {
            if (req.status === 200 && reqVerb === 'GET') {

                document.body.style.marginBottom = '200px';

                var xml = (new DOMParser()).parseFromString(req.responseText, 'application/xml');

                var results = document.createElement('div');
                results.className = 'rowShadow results';
                var resultsID = 'results' + nrOfResults;
                results.id = resultsID
                nrOfResults++;

                var listDiv = function(name, grey) {
                    var div = document.createElement('div');
                    div.textContent = name
                    if (grey) {
                        div.className = 'greyed_out';
                    }
                    var li = document.createElement('li');
                    li.appendChild(div);
                    return li;
                }

                var header = document.createElement('ul');
                header.className = 'th';

                header.appendChild(listDiv('ID'));
                header.appendChild(listDiv('Namn'));
                header.appendChild(listDiv('Telefon'));

                results.appendChild(header);

                var oddRow = true;

                var ids = xml.getElementsByTagName('id');
                var names = xml.getElementsByTagName('name');
                var tlfs = xml.getElementsByTagName('tlf');

                for (var i = 0; i < names.length; i++) {

                    var contactList = document.createElement('ul');
                    contactList.className = (oddRow) ? 'tr_odd' : 'tr_even';

                    var id = ids[i].firstChild;
                    var id_grey = (id) ? false : true;
                    id = (id) ? id.textContent : '<null>';

                    var name = names[i].firstChild;
                    var name_grey = (name) ? false : true;
                    name = (name) ? name.textContent : '<null>';

                    var tlf = tlfs[i].firstChild;
                    var tlf_grey = (tlf) ? false : true;
                    tlf = (tlf) ? tlf.textContent : '<null>';

                    contactList.appendChild(listDiv(id, id_grey));
                    contactList.appendChild(listDiv(name, name_grey));
                    contactList.appendChild(listDiv(tlf, tlf_grey));

                    results.appendChild(contactList);

                    oddRow = !oddRow;
                }

                insertAfter(results, $('app').firstElementChild);
                $(resultsID).style.marginTop = -100;
                $(resultsID).style.opacity = 0;
                var fadeIn = _ => {
                    expDecayAnimate(x => {
                        $(resultsID).style.marginTop = x;
                        /* Scrolling window along results
                        window.scrollTo(window.pageXOffset, document.body.scrollHeight - window.innerHeight);
                        */
                        return false;
                    }, -$(resultsID).clientHeight, 50, 10);
                    expDecayAnimate(x => {
                        $(resultsID).style.opacity = x;
                        return false;
                    }, 0, 1, 10);
                };
                // Delay after having prepared data, to showing it
                setTimeout(fadeIn, 1);
            }
        }
    };
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

    // get existing fields, only with text fields without ids
    var existingInputFields = document.getElementsByClassName('inputfield');
    var inputForm = [];
    for (var i = 0, n; n = existingInputFields[i]; i++) {
        if (n.firstElementChild.id === '' && n.tagName === 'P') inputForm.push(n);
    }

    inputFields.push(inputForm);

    setState('get_pane');
}

window.addEventListener('load', initializeState, false);
window.addEventListener('load', _ => {
    $('submit_button').style.opacity = 1;
    $('submit_button').addEventListener('click', sendRequest, false);
    $('submit_button').addEventListener('mouseover', _ => {
        if ($('submit_button').style.opacity < '0.01') {
            expDecayAnimate(x => {$('submit_button').style.opacity = x; return false;}, 0, 1, 10)}
        }
    , false);
});
window.addEventListener('load', _ => {
    $('new_fields_button').addEventListener('click', addFormFields, false);
});
window.addEventListener('load', _ => {

    var stopAnim = function() {
        _userScrolled = true;
    };

    window.addEventListener('mousedown', stopAnim);
    window.addEventListener('mousewheel', stopAnim);
    window.addEventListener('DOMMouseScroll', stopAnim);
    window.addEventListener('keyup', stopAnim);
    window.addEventListener('wheel', stopAnim);
    window.addEventListener('touchmove', stopAnim);
});