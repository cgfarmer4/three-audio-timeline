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
        if (this.element) {
            while (this.element.firstChild) {
                this.element.removeChild(this.element.firstChild);
            }
        }
        else {
            this.element = document.createElement('div');
            this.element.id = 'detailsView';
        }
    }
    easingInput(easingSelected) {
        let easingOptions = '<select class="form-select" id="easingInput" style="margin: 5px 0;">';

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
        let template = this.track.template();
        this.element.innerHTML = template;
        this.element.style.display = 'block';
        document.body.appendChild(this.element);
        this.track.detailsEvents();
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
                        <label for="keyEndTime">End Time: (calculated)</label>
                        <input id="keyEndTime" type="text" value="${Math.floor(this.key.endTime * 100) / 100}" disabled>
                    </li>
                    <li>
                        <label for="keyEndValue">End Value:</label>
                        <input id="keyEndValue" type="text" value="${this.key.endValue}">
                    </li>
                    <li>${this.easingInput(this.key.easing)}</li>
                    <li><button class="mediumButton" id="keyRemove"> Remove </button></li>
                </ul>`;

        this.element.innerHTML = template;
        document.body.appendChild(this.element);
        this.keyEvents();
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
            this.key.parent.emit('change:updateTime');
        }

        start.onchange = (event) => {
            this.key.startTime = Number(event.target.value);
            this.key.time = this.key.startTime;
            this.key.endTime = this.key.startTime + Number(this.key.duration);
            keyEndTime.value = this.key.endTime;
            this.key.parent.emit('change:updateTime');
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
            parent.emit('change:updateTime');
            document.getElementById('detailsView').remove();
        }
    }
}

module.exports = DetailsView;