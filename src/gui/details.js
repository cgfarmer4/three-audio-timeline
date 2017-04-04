'use_strict'
const Easing = require('../easing.js');
const EventEmitter = require('events').EventEmitter

class DetailsView extends EventEmitter {
    constructor(track) {
        super();

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
        let easing = this.easingInput(this.key.easing);
        let template = `<header>
                    <h1>key</h1>
                </header>
                <ul>
                    <li>ID: ${this.key.id}</li>
                    <li>Name: ${this.key.name}</li>
                    <li>Easing: ${easing}</li>
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
        switch(this.track.type) {
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
                <input type="checkbox" id="cbox1" value="first_checkbox">
                <label for="cbox1">Follow</label>
                <select name="select">
                    <option value="value1">Value 1</option> 
                    <option value="value2" selected>Value 2</option>
                    <option value="value3">Value 3</option>
                </select>
            </div>
            <button>Delete</button>
        </div>`;
    }
}

module.exports = DetailsView;