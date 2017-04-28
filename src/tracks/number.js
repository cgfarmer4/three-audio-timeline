'use_strict';

/**
 * Stores array of values from an input that is integers or floats.
 */
class NumberTrack {
    constructor(name, timeline, followInputTarget, sampleRate, inputModifier) {
        this.id = name;
        this.targetName = name || {};
        this.inputModifier = inputModifier || '';
        this.followInputTarget = followInputTarget;
        this.timeline = timeline;
        this.type = 'number';
        this.data = [];
        this.unmodifiedValues = [];
        this.min = 0;
        this.max = 1;
        this.inputChanges = 0;
        this.nextTick = 0;
        this.labelHeight = 50;
        this.recording = false;
        this.sampleRate = Number(sampleRate) || 1;
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
        if (this.followInputTarget.indexOf('Channel') > -1) {
            return this.timeline.envelop.maxValues.channels[this.followInputTarget];
        }
        else {
            console.log("INPUT!", this.timeline.envelop.maxValues.inputs[this.followInputTarget]);
        }
    }
    recordMomentary() {
        let value = this.getTargetValue();
        this.data.push(value);
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
            this.unmodifiedValues = this.unmodifiedValues.concat(this.data);
        }

        let modifiedData = {};

        this.inputModifier = this.inputModiferElement.value;
        this.inputChanges += 1;

        if (this.inputModifier === '') {
            this.data = this.unmodifiedValues;
            this.min = Math.min.apply(null, this.data);
            this.max = Math.max.apply(null, this.data);
            return;
        }

        //update data
        this.data.forEach((dataPoint, index) => {
            let value = `${dataPoint} ${this.inputModifier}`;
            modifiedData[index] = eval(value);
        });

        this.data = modifiedData;

        //update draw template
        this.min = Math.min.apply(null, this.data);
        this.max = Math.max.apply(null, this.data);
    }
    getRecording() {
        if(this.recording) {
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
                    <li><button class="mediumButton" id="recordMomentary">Push value</button></li>
                    <li><button class="mediumButton" id="recordTimeline">${this.getRecording()}</button></li>
                    <li><button class="mediumButton" id="removeTrack">Remove Track</button></li>
                </ul>`;

    }
}

module.exports = NumberTrack;
