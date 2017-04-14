'use_strict';

/**
 * Stores array of values from an input that is integers or floats.
 */
class NumberTrack {
    constructor(name, timeline, followInputTarget, sampleRate) {
        this.id = name;
        this.targetName = name || {};
        this.followInputTarget = followInputTarget;
        this.timeline = timeline;
        this.type = 'number';
        this.data = [];
        this.min = 0;
        this.max = 1;
        this.currentValue = 0;
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
    }
    getTargetValue() {
        if (this.followInputTarget.indexOf('Speaker') > -1) {
           return this.timeline.envelop.maxValues.speakers[this.followInputTarget];
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
        if(this.recording) {
            this.recording = false;
            this.timelineRecord.textContent = 'Timeline Record Loop';
        }
        else {
            this.recording = true;
            this.nextTick = Math.floor(this.timeline.time + this.sampleRate);
            this.timelineRecord.textContent = 'Stop';
        }
    }
    template() {
        return `<header>
                    <h2>${this.type}</h2>
                    <h3>${this.targetName}</h3>
                </header>
                <ul>
                    <li id="sampleRate">Sample Rate: ${this.sampleRate}</li>
                    <li id="followingInput">${this.followInputTarget}</li>
                    <li><button id="recordMomentary">Momentary Record</button></li>
                    <li><button id="recordTimeline">Timeline Record Loop</button></li>
                    <li><button id="removeTrack">Remove Track</button></li>
                </ul>`;

    }
}

module.exports = NumberTrack;
 