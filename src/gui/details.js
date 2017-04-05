'use_strict'
const Easing = require('../easing.js');
const EventEmitter = require('events').EventEmitter

class DetailsView extends EventEmitter {
    constructor(timeline) {
        super();

        this.timeline = timeline;
        this.on('displayTrack', (track) => {
            this.track = track;
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
                    <li>Num Keys: ${this.track.keys.length}</li>
                    <li>Start: ${this.track.startTime}</li>
                    <li>End: ${this.track.endTime}</li>
                </ul>
                <div id="follow">
                    Follow input
                    ${this.followableInput()}
                   <div>
                        <input name="followKeysOptions" type="radio" id="radio1" value="ignoreKeys" checked=true>
                        <label for="radio1">Ignore keys and follow</label>
                   </div>
                   <div>
                    <input name="followKeysOptions" type="radio" id="radio2" value="useValues">
                    <label for="radio2">Use values at keys</label>
                    <input type="text" placeholder="modify follow value"></input>
                    </div>
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
            followableOptions += '<option value="' + index + '">' + track.targetName + '</option>';
        })

        followableOptions += '</select>';

        return followableOptions;
    }
    keyframeEvents() {
        let followInput = document.getElementById('followSelect');
        let followModifier = document.getElementById('');

        followInput.onchange = (event) => {
            //remove properties if deselected
            if (event.target.value === 'noFollow') {
                this.track.following = false;
                this.track.followTrack = {};
                return;
            }

            //select followed track.
            let selected = this.followableTracks[event.target.value];
            this.track.isFollowing = true;
            this.track.followTrack = selected;            

            //update followed track properties with either 1. ignore or 2. use values
            let followKeyOptionSelected = document.querySelector('input[name="followKeysOptions"]:checked').value;
            this.track.followType = followKeyOptionSelected;
        }
    }
}

module.exports = DetailsView;