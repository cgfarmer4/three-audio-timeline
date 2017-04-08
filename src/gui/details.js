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
    displayKey() {
        this.clearDetails();
        let template = `<header>
                    <h1>key</h1>
                </header>
                <ul>
                    <li>ID: ${this.key.id}</li>
                    <li>Name: ${this.key.name}</li>
                    <li>Easing: ${this.easingInput(this.key.easing)}</li>
                    <li>Delay: ${this.key.delay}</li>
                    <li>Start Time: ${this.key.startTime}</li>
                    <li>End Time: ${this.key.endTime}</li>
                    <li>Time: ${this.key.time}</li>
                    <li>End Value: ${this.key.endValue}</li>
                </ul>`;

        this.details.innerHTML = template;
        document.body.appendChild(this.details);
    }
    easingInput(easingSelected) {
        let easingOptions = '<select>';

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

        if(this.track.type === 'keyframe') {
            this.keyframeEvents();
        }
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
                    <h1>${this.track.type}</h1>
                </header>
                <ul>
                    <li>Name: ${this.track.targetName} </li>
                </ul>`;
    }
    keyframeTrackTemplate() {
        return `<header>
                        <h1>${this.track.type}</h1>
                </header>
                <ul>
                    <li>Name: ${this.track.targetName} </li>
                    <li>Property: ${this.track.selectedProperty} </li>
                    <li>Start: ${this.track.startTime}</li>
                    <li>End: ${this.track.endTime}</li>
                </ul>
                <div id="follow">
                    Follow input
                    ${this.followableInput()}
                    ${this.followTypeRadio()}
                    <input type="text" placeholder="modify follow value"></input>
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
        let types = '<div id="followModifier">'
        
        if (selected.followType === 'ignoreKeys' || selected.followType !== 'useValues') {
            types += '<input name="followKeysOptions" type="radio" id="radio1" value="ignoreKeys" checked=true>';
        }
        else {
            types += '<input name="followKeysOptions" type="radio" id="radio1" value="ignoreKeys">';
        }
        
        types += '<label for="radio1">Ignore keys and follow values.</label><br>';

        if (selected.followType === 'useValues') {
            types += '<input name="followKeysOptions" type="radio" id="radio2" value="useValues" checked=true>';
        }
        else {
            types += '<input name="followKeysOptions" type="radio" id="radio2" value="useValues">';
        }
            
        types += '<label for="radio2">Use easing at keys. Values will be calculated based on relative time indexes.</label></div>';

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
}

module.exports = DetailsView;