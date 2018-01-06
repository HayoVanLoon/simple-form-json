"use strict";

/**
 * Replaces a form's default submit function with a function that harvests its
 * fields and constructs a json. The basic meta-data is taken from the form and
 * input attributes. Nested structure is determined through the html-classes
 * 'json-object' and 'json-array'.
 * @param formId    Id of form to modify (if undefined, all forms are treated)
 * @param forAsync  If false (default), a new form containing the json is
 * created and submitted. If set to true, adds a hidden field containing the
 * json.
 */
function simpleFormJson(formId, forAsync) {

    function contains(xs, value) {
        for (var i = 0; i < xs.length; i += 1) {
            if (xs[i] === value) {
                return true;
            }
        }
        return false;
    }

    function isJsonObject(elem) {
        return contains(elem.classList, 'json-object');
    }

    function isJsonArray(elem) {
        return contains(elem.classList, 'json-array');
    }

    function harvestInputValue(elem) {
        if (elem.type === 'number') {
            if (elem.step && elem.step !== '0' && parseFloat(elem.step) < 1) {
                return parseFloat(elem.value);
            } else {
                return parseInt(elem.value);
            }
        } else if (elem.type === 'checkbox') {
            return 'checked' === elem.value;
        } else {
            return elem.value;
        }
    }

    function harvestJsonObject(elem) {
        var acc = {};

        var children = elem.children;
        for (var i = 0; i < children.length; i += 1) {
            var sub = harvest(children[i]);
            for (var key in sub) {
                acc[key] = sub[key]
            }
        }

        return acc;
    }

    function harvestArray(elem) {
        var arr = [];
        var children = elem.children;
        for (var i = 0; i < children.length; i += 1) {
            var sub = harvest(children[i]);
            for (var key in sub) {
                arr.push(sub[key]);
            }
        }
        return arr;
    }

    /**
     * Recursively harvests the data.
     * @param elem {{string}}      element containing the data
     * @returns {{object}}
     */
    function harvest(elem) {
        var acc = {};

        if (elem.tagName === 'INPUT') {
            acc[elem.name] = harvestInputValue(elem);
        } else if (isJsonObject(elem)) {
            acc[elem.id ? elem.id : '_object_without_id'] = harvestJsonObject(elem);
        } else if (isJsonArray(elem)) {
            acc[elem.id ? elem.id : '_array_without_id'] = harvestArray(elem);
        } else {
            var children = elem.children;
            for (var i = 0; i < children.length; i += 1) {
                var sub = harvest(children[i]);
                for (var key in sub) {
                    acc[key] = sub[key]
                }
            }
        }

        return acc;
    }

    function replaceSubmit(formElem) {
        formElem.addEventListener('submit', function (event) {
            event.preventDefault();

            var data = harvest(event.target);

            var hiddenJson = document.createElement('input');
            hiddenJson.setAttribute('type', 'hidden');
            hiddenJson.setAttribute('value', JSON.stringify(data));
            hiddenJson.setAttribute('name', 'data');

            if (forAsync) {
                formElem.append(hiddenJson);
            } else {
                var synthForm = document.createElement('form');
                synthForm.setAttribute('method', 'POST');
                synthForm.setAttribute('action', formElem.action);
                synthForm.appendChild(hiddenJson);

                document.body.appendChild(synthForm);

                synthForm.submit();
            }
        }, false);
    }

    if (formId) {
        replaceSubmit(document.getElementById(formId));
    } else {
        var elems = document.getElementsByTagName('form');
        for (var i = 0; i < elems.length; i += 1) {
            replaceSubmit(elems[i]);
        }
    }
}
