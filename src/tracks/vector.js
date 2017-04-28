'use_strict';

/**
 * Stores array of values for a 3D element's positioning.
 */
class VectorPosition {
    constructor(name, timeline, followInputTarget, sampleRate, inputModifier) {
        this.id = name;
        this.targetName = name || {};
        this.inputModifier = inputModifier || '';
        this.followInputTarget = followInputTarget;
        this.timeline = timeline;
        this.labelHeight = 90;
        this.type = 'position';
        this.sampleRate = Number(sampleRate) || 1;
        this.min = -500;
        this.max = 500;
        this.nextTick = 0;
        this.recording = false;
        this.inputChanges = 0;
        this.unmodifiedValues = {};
        this.data = {
            x: [],
            y: [],
            z: []
        }

        this.timeline.tracks.push(this);
    }
    detailsEvents() {
        let record = document.getElementById('recordMomentary');
        record.onclick = this.recordMomentary.bind(this);

        this.timelineRecord = document.getElementById('recordTimeline');
        this.timelineRecord.onclick = this.recordInSyncWithTimeline.bind(this);

        let removeTrack = document.getElementById('removeTrack');
        removeTrack.onclick = (event) => {
            this.timeline.tracks.splice(this.timeline.tracks.indexOf(this), 1);
            document.getElementById('detailsView').remove();
        }

        this.inputModiferElement = document.getElementById('inputModifier');
        this.inputModiferElement.onchange = this.updateModifier.bind(this);
    }
    getTargetValue() {
        if (this.followInputTarget.indexOf('Input') > -1) {
            return this.timeline.envelop.maxValues.inputs[this.followInputTarget];
        }
        else {
            console.log("Channel!", this.timeline.envelop.maxValues.channels[this.followInputTarget]);
        }
    }
    recordMomentary() {
        let value = this.getTargetValue();
        this.data.x.push(value[0]);
        this.data.y.push(value[1]);
        this.data.z.push(value[2]);
    }
    recordInSyncWithTimeline() {
        if (this.recording) {
            this.recording = false;
            this.timelineRecord.textContent = 'Record';
        }
        else {
            this.recording = true;
            this.nextTick = Math.floor(this.timeline.time + this.sampleRate);
            this.timelineRecord.textContent = 'Stop';
        }
    }
    updateModifier(event) {
        //back up data values
        if (this.inputChanges === 0) {
            this.unmodifiedValues = Object.assign({}, this.data);
        }

        let modifiedData = {
            x: [],
            y: [],
            z: []
        };

        this.inputModifier = this.inputModiferElement.value;
        this.inputChanges += 1;

        if (this.inputModifier === '') {
            this.data = this.unmodifiedValues;
            this.min = Math.min.apply(null, this.data);
            this.max = Math.max.apply(null, this.data);
            return;
        }

        //x
        this.data.x.forEach((dataPoint, index) => {
            let value = `${this.unmodifiedValues.x[index]} ${this.inputModifier}`;
            modifiedData.x[index] = eval(value);
        });

        //y
        this.data.y.forEach((dataPoint, index) => {
            let value = `${this.unmodifiedValues.y[index]} ${this.inputModifier}`;
            modifiedData.y[index] = eval(value);
        });

        //z
        this.data.z.forEach((dataPoint, index) => {
            let value = `${this.unmodifiedValues.z[index]} ${this.inputModifier}`;
            modifiedData.z[index] = eval(value);
        });

        this.data = modifiedData;

        //update draw template
        this.min = Math.min.apply(null, this.data);
        this.max = Math.max.apply(null, this.data);
    }
    getRecording() {
        if (this.recording) {
            return 'Stop';
        }
        else {
            return 'Record';
        }
    }
    template() {
        return `<header>
                    <h2>${this.type}</h2>
                    <h3>${this.targetName}</h3>
                </header>
                <ul>
                    <li id="followingInput">Follow: <br> <span style="font-weight: 700; font-size: 12px;">${this.followInputTarget}</span></li>
                    <li>Sample Rate: <input id="sampleRate" type="text" value="${this.sampleRate}"</li>
                    <li><input type="text" id="inputModifier" placeholder="Input Modifier" value="${this.inputModifier}"/></li>
                    <li><button class="mediumButton" id="recordMomentary">Push Value</button></li>
                    <li><button class="mediumButton" id="recordTimeline"> ${this.getRecording()} </button></li>
                    <li><button class="mediumButton" id="removeTrack">Remove Track</button></li>
                </ul>`;
    }
}

module.exports = VectorPosition;
