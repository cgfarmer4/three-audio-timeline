'use_strict';
const KeyframeTrack = require('../tracks/keyframe');
const NumberTrack = require('../tracks/number');

class Toolbar {
    constructor(timeline) {
        this.timeline = timeline;
        this.element = document.createElement('div');
        this.element.innerHTML = this.template();

        this.element.querySelector('#addTrack').onclick = this.addTrack.bind(this);
        this.element.querySelector('#playButton').onclick = this.timeline.play.bind(this.timeline);
        this.element.querySelector('#pauseButton').onclick = this.timeline.pause.bind(this.timeline);
        this.element.querySelector('#stopButton').onclick = this.timeline.stop.bind(this.timeline);
        this.time = this.element.querySelector('#currentTime');
    }
    template() {
        return `<div id="toolbar" style="margin-top: -20px;">
            <!--<p id="currentTime>0:00</p>-->
            <button id="playButton">play</button>
            <button id="pauseButton">pause</button>
            <!--<button id="exportButton">export</button>-->
            <button id="stopButton">stop</button>
            <button id="addTrack">add track</button>
            <!--<button id="loop">loop</button>>-->
            <div id="currentTime" style="display: inline-block;">0</div>
        </div>`;
    }
    addTrack() {
        let template = `<div id="addTrackGui" style="float: left;  padding: 10px;">
            <input id="trackName" style=" margin: 0 10px;" type="text" placeholder="Name">
            <select id="trackType" style="">
                <option value="key">Keyframe</option>
                <option selected value="channel">Channel</option>
                <option value="input">Input</option>
            </select>
            <span id="selectTarget" style="margin: 0 5px; font-size: 12px;">Select input positioning or channel data to record from Envelop Gui. </span>
            <input id="sampleRate" style=" margin: 0 10px;" type="text" placeholder="Sample Rate (e.g .1, 1, 5)">
            <button class="addTrack"> Add </button>
            </div>
            <div class="close" style="float: left; padding: 10px 20px; background-color: #fff; cursor: pointer;"> x </div>`;
        
        this.addTrackGui = document.createElement('div');
        this.addTrackGui.innerHTML = template;
        this.element.appendChild(this.addTrackGui);

        //Events
        this.addTrackGui.querySelector('.close').onclick = (event) => {
            this.addTrackGui.remove();
        }

        this.addTrackGui.querySelector('.addTrack').onclick = (event) => {
            if (!this.newTrackTarget) return alert('No target set');
            this.addTrackToTimeline(event);
            this.addTrackGui.remove();
        }

        //TODO: Break out to remove dependency
        this.timeline.envelop.on('add:trackTarget', (event) => {
            let targetType = {};
            this.newTrackTarget = event.name;
            this.addTrackGui.querySelector('#selectTarget').innerHTML = event.name;
        });
    }
    /**
     * Read values from the inputs and construct a new Timeline object based on that.
     * @param {Event} event 
     */
    addTrackToTimeline(event) {
        let trackName = this.element.querySelector('#trackName').value;
        let trackType = this.element.querySelector('#trackType');
        trackType = trackType.options[trackType.selectedIndex].value;

        switch (trackType) {
            case 'channel': 
                let sampleRate = this.addTrackGui.querySelector('#sampleRate').value;
                new NumberTrack(trackName, this.timeline, this.newTrackTarget, sampleRate);
                break;

            case 'keyframe':
                new KeyframeTrack(trackName, this.newTrackTarget, this.timeline);
                break;
        }
    }
}

module.exports = Toolbar;