'use_strict'
const Easing = require('../easing.js');
const EventEmitter = require('events').EventEmitter

class DetailsView extends EventEmitter {
    constructor(timeline) {
        super();
        this.timeline = timeline;

        this.on('displayTrack', (eventData) => {
            this.track = eventData.target;
            this.track.selectedProperty = eventData.property;
            this.displayTrack();
        })

        this.on('displayKey', (key) => {
            this.key = key;
            this.track.selectedProperty = key.propertyName;
            this.displayKey();
        })
    }
    clearDetails() {
        if (this.details) {
            while (this.details.firstChild) {
                this.details.removeChild(this.details.firstChild);
            }
        }
        else {
            this.details = document.createElement('div');
            this.details.id = 'detailsView';
        }
    }
    easingInput(easingSelected) {
        let easingOptions = '<select id="easingInput">';

        for (let easingFunctionFamilyName in Easing) {
            let easingFunctionFamily = Easing[easingFunctionFamilyName];
            for (let easingFunctionName in easingFunctionFamily) {
                if (easingFunctionFamilyName + "." + easingFunctionName === easingSelected) {
                    easingOptions += '<option selected="true">' + easingFunctionFamilyName + "." + easingFunctionName + '</option>';
                }
                else {
                    easingOptions += '<option>' + easingFunctionFamilyName + "." + easingFunctionName + '</option>';
                }
            }
        }

        easingOptions += '</select>';

        return easingOptions;
    }
    displayTrack() {
        this.clearDetails();

        let template = '';
        switch (this.track.type) {
            case 'number':
                template = this.numberTemplate();
                break;
            case 'position':
                template = this.positionTemplate();
                break;
            case 'key':
                break;
            case 'keyframe':
                template = this.keyframeTrackTemplate();
                break;
            default:
                break;
        }

        this.details.innerHTML = template;
        document.body.appendChild(this.details);

        if (this.track.type === 'keyframe') {
            this.keyframeEvents();
        }
    }
    displayKey() {
        this.clearDetails();
        let template = `<header>
                    <h2>key</h2>
                    <h3>${this.key.id}</h3>
                </header>
                <ul id="keyEdit">
                    <!--<li><label>Time:</label> <span style="font-size: 12px">${this.key.time}</span></li>-->
                    <li>
                        <label for="keyStart">Start Time:</label>
                        <input id="keyStart" type="text" value="${this.key.startTime}">
                    </li>
                                        <li>
                        <label for="keyDuration">Duration:</label>
                        <input id="keyDuration" type="text" value="${this.key.duration}">
                    </li>
                    <li>
                        <label for="keyEndTime">End Time:</label>
                        <input id="keyEndTime" type="text" value="${this.key.endTime}" disabled>
                    </li>
                    <li>
                        <label for="keyEndValue">End Value:</label>
                        <input id="keyEndValue" type="text" value="${this.key.endValue}">
                    </li>
                    <li>${this.easingInput(this.key.easing)}</li>
                    <li><button id="keyRemove"> Remove </button></li>
                </ul>`;

        this.details.innerHTML = template;
        document.body.appendChild(this.details);
        this.keyEvents();
    }
    positionTemplate() {
        return `<header>
                    <h1>${this.track.type}</h1>
                </header>
                <ul>
                    <li>Name: ${this.track.targetName} </li>
                </ul>`;
    }
    numberTemplate() {
        return `<header>
                    <h2>${this.track.type}</h2>
                    <h3>${this.track.targetName}</h3>
                </header>
                `;
    }
    keyframeTrackTemplate() {
        return `<header>
                        <h2>${this.track.type} track</h2>
                        <h3>${this.track.targetName}.${this.track.selectedProperty}</h3>
                </header>
                <ul>
                    <li>Start: ${this.track.startTime}</li>
                    <li>End: ${this.track.endTime}</li>
                </ul>
                <div id="follow" style="padding: 10px">
                    <h4 style="margin: 0 0 10px 0;">Follow input</h4>
                    ${this.followableInput()}
                    ${this.followTypeRadio()}
                    <!--<input type="text" placeholder="modify follow value"></input>-->
                </div>`;
    }
    followableInput() {
        this.followableTracks = [];

        this.timeline.tracks.forEach((track) => {
            if (track.type === 'number') {
                this.followableTracks.push(track);
            }
        })

        let followableOptions = '<select id="followSelect"><option value="noFollow"> ---------- </option>';

        this.followableTracks.forEach((track, index) => {
            let selected = this.track.keysMap[this.track.selectedProperty];
            if (selected.following && selected.followTrack.targetName === track.targetName) {
                followableOptions += '<option value="' + index + '" selected>';
            }
            else {
                followableOptions += '<option value="' + index + '">';
            }

            followableOptions += track.targetName + '</option>';
        })

        followableOptions += '</select>';

        return followableOptions;
    }
    followTypeRadio() {
        let selected = this.track.keysMap[this.track.selectedProperty];
        let types = '<div id="followModifier" style="margin: 10px 0;">\
        <div class="option1">';

        if (selected.followType === 'ignoreKeys' || selected.followType !== 'useValues') {
            types += '<input name="followKeysOptions" type="radio" id="radio1" value="ignoreKeys" checked=true>';
        }
        else {
            types += '<input name="followKeysOptions" type="radio" id="radio1" value="ignoreKeys">';
        }

        types += '<label for="radio1">Key for every data point.</label></div><div class="option2">';

        if (selected.followType === 'useValues') {
            types += '<input name="followKeysOptions" type="radio" id="radio2" value="useValues" checked=true>';
        }
        else {
            types += '<input name="followKeysOptions" type="radio" id="radio2" value="useValues">';
        }

        types += '<label for="radio2">Set all keys values to nearest data points.</label></div></div>';

        return types;
    }
    keyframeEvents() {
        let followInput = document.getElementById('followSelect');
        let followModifier = document.getElementById('followModifier');

        followModifier.onclick = (event) => {
            this.track.keysMap[this.track.selectedProperty].followType = document.querySelector('input[name="followKeysOptions"]:checked').value;
            this.track.emit('follow:updateModifier', event);
        }

        followInput.onchange = (event) => {
            this.track.emit('follow:update', {
                event: event,
                followableTracks: this.followableTracks
            });
        }
    }
    keyEvents() {
        let keyEdit = document.getElementById('keyEdit');
        let duration = keyEdit.querySelector('#keyDuration');
        let start = keyEdit.querySelector('#keyStart');
        let keyEndTime = keyEdit.querySelector('#keyEndTime');
        let keyEndValue = keyEdit.querySelector('#keyEndValue');
        let easingInput = keyEdit.querySelector('#easingInput');
        let keyRemove = keyEdit.querySelector('#keyRemove');

        duration.onchange = (event) => {
            this.key.duration = Number(event.target.value);
            this.key.endTime = this.key.duration + Number(this.key.startTime);
            keyEndTime.value = this.key.endTime;
        }

        start.onchange = (event) => {
            this.key.startTime = Number(event.target.value);
            this.key.time = this.key.startTime;
            this.key.endTime = this.key.startTime + Number(this.key.duration);
            keyEndTime.value = this.key.endTime;
        }

        keyEndValue.onchange = (event) => {
            this.key.endValue = event.target.value;
        }

        easingInput.onchange = (event) => {
            this.key.easing = event.target.value;
        }

        keyRemove.onclick = (event) => {
            let keys = [];
            let parent = this.key.parent;
            let selectedKeyGroup = parent.keysMap[parent.selectedProperty];
            
            (selectedKeyGroup.following) ? keys = selectedKeyGroup.followKeys : keys = selectedKeyGroup.keys;
            let keyIndex = keys.indexOf(this.key);

            keys.splice(keyIndex, 1);
            document.getElementById('detailsView').remove();
        }

    }
}

module.exports = DetailsView;