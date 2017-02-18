var currState = '';

var inputFields = [];

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

function sendRequest() {

    var chosenID = $('velg_id').children[0].value;

    var xml = document.implementation.createDocument(null, 'contacts');

    inputFields.forEach( inputForm => {

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

    // Debug only
    alert((new XMLSerializer()).serializeToString(xml));

    /*
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
    */
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

    // get existing fields, only without ids
    var existingInputFields = document.getElementsByClassName('inputfield');
    var inputForm = [];
    for (var i = 0, n; n = existingInputFields[i]; i++) {
        if (n.id === '' && n.tagName === 'P') inputForm.push(n);
    }

    inputFields.push(inputForm);

    setState('get_pane');
}

window.addEventListener('load', initializeState, false);
window.addEventListener('load', _ => {
    $('submit_button').addEventListener('click', sendRequest, false);
}, false);
window.addEventListener('load', _ => {
    $('new_fields_button').addEventListener('click', addFormFields, false);
});