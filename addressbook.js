var _userScrolled = false;
var _fadeOutWasAborted = false;
var nrOfResults = 0;
var nrOfStatuses = 0;
var nrOfStatusAbortions = [];

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

function sigmoidAnimate(f, cp, fp, s, finalize) {
    linearAnimate( x => {
        return f(Math.max(fp, cp) + (fp - cp) / (1 + Math.exp(-10 * (x - 0.5))));
    }, 0, 1, s, finalize);
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

function bringStatusIntoView(status) {

    var scrollDist = window.pageYOffset;
    var windowHeight = window.innerHeight;
    var docHeight = document.body.scrollHeight;

    var pos = $(status).getBoundingClientRect().top;

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
                      var c  = '#f2ffef';
                      var sh = '#a0caa0';
                      break;
        case 'red':   var bg = '#ff6770';
                      var bc = '#d06070';
                      var c  = '#fff2ef';
                      var sh = '#caa0a0';
                      break;
        case 'orange':var bg = '#f5c268';
                      var bc = '#e0a020';
                      var c  = '#ffffe0';
                      var sh = '#caa050';
                      break;
    }
    var div = document.createElement('div');
    div.className = 'WarningResponse';
    var status = 'status' + nrOfStatuses;
    div.id = status;
    nrOfStatuses++;
    div.style.backgroundColor = bg;
    div.style.borderColor = bc;
    var innerText = document.createElement('div');
    innerText.style.color = c;
    innerText.style.textShadow = sh;
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

function interruptibleStatusFadeOut(f, status) {
    
    return o => {
        if (nrOfStatusAbortions[status] < 2) {
            if (_fadeOutWasAborted) {
                $(status).style.opacity = 1;
                $(status).style.filter = 'blur(0px)';
                nrOfStatusAbortions[status]++;
                if (nrOfStatusAbortions[status] < 2) {
                    f(5000);
                }
                return true;
            }
            if (o < 0.3) {
                if (nrOfResults > 0) {
                    var currentMargin = parseFloat($('results' + (nrOfResults - 1)).style.marginTop.substring(0, 4));
                    currentMargin = 50;
                    var statusMarginTop = parseFloat(window.getComputedStyle($(status)).getPropertyValue('margin-top').substring(0, 2));
                    var statusMarginBottom = parseFloat(window.getComputedStyle($(status)).getPropertyValue('margin-bottom').substring(0, 2));
                    sigmoidAnimate(x => {
                        $(status).nextElementSibling.style.marginTop = x;
                    }, currentMargin, currentMargin - ($(status).clientHeight + statusMarginTop + statusMarginBottom) - 2, 1, _ => {
                        $(status).nextElementSibling.style.marginTop = currentMargin;
                        $(status).remove();
                        nrOfStatuses--;
                        nrOfStatusAbortions[status] = 0;
                    });
                }
                nrOfStatusAbortions[status] = 2;
            }
        }

        $(status).style.opacity = o;
        o *= -1;
        o++;
        o *= 10;

        $(status).style.filter = 'blur(' + o + 'px)';

        return false;
    }
}

function displayMessage(str, color, permanent) {

    permanent = (typeof permanent !== 'undefined') ? permanent : false;

    var status = 'status' + nrOfStatuses;
    nrOfStatusAbortions[status] = 0;

    insertAfter(createStatusMessage(str, color), $('app').firstElementChild);
    expDecayAnimate(x => {$(status).style.opacity = x; return false;}, 0.0, 1.0, 4);
    expDecayAnimate(x => {$(status).style.filter = 'blur(' + x + 'px)'; return false;}, 10.0, 0.0, 8);
    var startFadeOutTimer = time => setTimeout( _ => {
        if (_fadeOutWasAborted) {
            _fadeOutWasAborted = false;
            startFadeOutTimer(time);
            return;
        }

        sigmoidAnimate(interruptibleStatusFadeOut(startFadeOutTimer, status), 1.0, 0.0, 1, _ => {
            setTimeout( _ => {
                if ($(status)) {
                    $(status).remove();
                    nrOfStatuses--;
                    nrOfStatusAbortions[status] = 0;
                }
            }, 3000);
        });
    }, time);
    _fadeOutWasAborted = false;
    $(status).addEventListener('mouseover', _ => _fadeOutWasAborted = true);
    if (!permanent) {
        startFadeOutTimer(5000);
    }
    bringStatusIntoView(status);
}

function sendRequest() {

    if ($('submit_button').opacity < 0.1) {
        return;
    }

    var chosenID = $('ID_selector').value;
    if ($('ID_selector').disabled) {
        chosenID = '';
    }

    expDecayAnimate(x => {
        $('submit_button').style.opacity = x;
        return false;
    }, 1, 0, 50);
    $('submit_button').style.cursor = 'auto';

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
                            break;
        default:            return;
    }

    var req = new XMLHttpRequest();
    req.open(reqVerb, apiResourcePath + chosenID, true);
    req.setRequestHeader('Content-Type', 'application/xml');
    req.onreadystatechange = handleResponse(req, reqVerb, chosenID);
    req.send(xml);
}

function handleResponse(req, reqVerb, _id) {
    return _ => {
        if ($('submit_button').style.opacity < '0.01') {
            expDecayAnimate(x => {$('submit_button').style.opacity = x; return false;}, 0, 1, 10);
            $('submit_button').style.cursor = 'pointer';
        }
        if (req.readyState === XMLHttpRequest.DONE) {
            function formatBold(str) {
                return '<b>'+str+'</b> '
            }
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
                        return false;
                    }, -$(resultsID).clientHeight, 50, 10);
                    expDecayAnimate(x => {
                        $(resultsID).style.opacity = x;
                        return false;
                    }, 0, 1, 10);
                };
                // Delay after having prepared data, to showing it
                setTimeout(fadeIn, 1);
            } else if (req.status === 204 && reqVerb === 'GET') {
                if (_id === '') {
                    displayMessage(formatBold('No Content') + 'Tom database', 'orange', false);
                } else {
                    displayMessage(formatBold('No Content') + 'Ingen treff funne for ID: ' + _id, 'orange', false);
                }
            } else if (req.status === 404) {
                displayMessage(formatBold('Not Found') + 'Ingen treff funne' + ((reqVerb === 'PUT') ? '<br>Database uforandra' : '<br>Ingen ting blei sletta'), 'orange', false);
            } else if (req.status === 200 && reqVerb === 'DELETE') {
                if (_id === '') {
                    displayMessage(formatBold('DELETED ') + 'Database sletta', 'green', true);
                } else {
                    displayMessage(formatBold('DELETED ') + _id + ' blei sletta', 'green', true);
                }
            } else if (req.status === 500) {
                displayMessage(formatBold('Internal Server Error') + 'Ein feil har oppstått<br>Ingen forandringar blei gjort<br>', 'red', false);
            } else if (req.status === 400) {
                displayMessage(formatBold('Bad Request') + 'Ingen forandring blei utført<br>Pass på at ID er eit heiltal<br>Telefonnummer må oppggjevast, men namn kan mangle', 'orange', false);
            } else if (req.status === 200 && reqVerb === 'PUT') {
                displayMessage(formatBold('OK') + _id + ' blei oppdatert', 'green', true);
            } else if (req.status === 201 && reqVerb === 'POST') {
                displayMessage(formatBold('OK') + req.responseText + ' rader lagt til', 'green', true);
            } else if (req.status === 405 && reqVerb === 'POST') {
                displayMessage(formatBold('Not Allowed') + 'Ei eller fleire rader finnast frå før<br>Ingen rader oppdatert', 'orange', false);
            } else {
                if (req.status === 0) {
                    displayMessage(formatBold('Ingen Svar') + 'Serveren svarar ikkje<br>Sjekk internettforbindelsen', 'red', false);
                } else {
                    displayMessage(formatBold(req.status) + 'Uventa feil oppstod', 'red', false);
                }
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
    window.addEventListener('keydown', stopAnim);
    window.addEventListener('wheel', stopAnim);
    window.addEventListener('touchmove', stopAnim);
});