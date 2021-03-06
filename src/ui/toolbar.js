'use_strict';
const THREE = require('three');
const KeyframeTrack = require('../tracks/keyframe');
const NumberTrack = require('../tracks/number');
const PositionTrack = require('../tracks/vector');

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
        return `<div id="toolbar" style="margin-top: -27px;">
            <!--<p id="currentTime>0:00</p>-->
            <div id="playButton"></div>
            <button id="pauseButton"></button>
            <button id="stopButton"></button>
            <button id="addTrack"></button>
            <!--<button id="loop">loop</button>>-->
            <div id="currentTime" style="display: inline-block;">0</div>
            <div id="audioStatus" style="display: inline-block;">audio:loading</div>
        </div>`;
    }
    addTrack() {
        let template = `<div id="addTrackGui" style="float: left;  padding: 10px;">
            <input id="trackName" style="font-size: 14px; padding: 9px 10px 13px 10px; margin: 0 10px; width: 150px; border: 3px solid #000;" type="text" placeholder="Name">
            <select class="form-select" id="trackType" style="">
                <option selected value="noValue"> ----- </option>
                <option value="keyframe">Keyframe</option>
                <option value="channel">Channel</option>
                <option value="position">Input</option>
            </select>
            <span id="selectTarget" style="margin: 0 5px; font-size: 12px; color: #FFF"></span>
            <input id="sampleRate" style="display: none; margin: 0 10px;" type="text" placeholder="Sample Rate (e.g .1, 1, 5)">
            <input id="inputModifier" style="display: none; margin: 0 10px;" type="text" placeholder="Input modifier (e.g. *20, +100)">
            
            <button class="addTrack mediumButton" style="margin-top: 4px;"> Add </button>
            </div>
            <div class="close" style="font-size: 24px; float: right; padding: 27px 20px; background-color: #fff; cursor: pointer;"> x </div>`;

        this.addTrackGui = document.createElement('div');
        this.addTrackGui.innerHTML = template;
        this.addTrackGui.style.background = "#000";
        this.addTrackGui.style.overflow = "hidden";
        this.element.appendChild(this.addTrackGui);
        this.selectTargetElement = this.addTrackGui.querySelector('#selectTarget');
        this.sampleRateElement = this.addTrackGui.querySelector('#sampleRate');
        this.inputModifierElement = this.addTrackGui.querySelector('#inputModifier');

        //Events
        this.addTrackGui.querySelector('.close').onclick = (event) => {
            this.addTrackGui.remove();
        }

        this.addTrackGui.querySelector('.addTrack').onclick = (event) => {
            if (!this.newTrackTarget) return alert('No target set');
            this.addTrackToTimeline(event);
            this.addTrackGui.remove();
        }

        this.addTrackGui.querySelector('#trackType').onchange = (event) => {
            let self = this;

            switch (event.target.value) {
                case 'keyframe':
                    this.selectTargetElement.textContent = 'Select target element with cursor.';
                    this.sampleRateElement.style.display = 'none';
                    this.inputModifierElement.style.display = 'none';

                    // Activate target click listener
                    document.body.onmousedown = this.activateTarget.bind(this);
                    break;

                case 'channel':
                    this.selectTargetElement.textContent = 'Select channel from Envelop.';
                    this.sampleRateElement.style.display = 'inline-block';
                    this.inputModifierElement.style.display = 'inline-block';
                    break;

                case 'position':
                    this.selectTargetElement.textContent = 'Select input from Envelop.';
                    this.sampleRateElement.style.display = 'inline-block';
                    this.inputModifierElement.style.display = 'inline-block';
                    break;

                    defaut:
                    this.selectTargetElement.textContent = 'Select track type.';
            }
        }

        //TODO: Break out to remove dependency
        this.timeline.envelop.on('add:trackTarget', (event) => {
            let targetType = {};
            this.newTrackTarget = event.name;
            this.addTrackGui.querySelector('#selectTarget').innerHTML = event.name;
        });
    }
    /**
     * Targets have been added to the timeline. Activate their selectability.
     * Manage the properties associated once they have been selected.
     * 
     * @param {DomEvent} event 
     */
    activateTarget(event) {
        event.preventDefault();
        let raycaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2();
        let targets = this.timeline.targets;

        // update the mouse variable
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        // find intersections
        raycaster.setFromCamera(mouse, this.timeline.camera);

        // create an array containing all objects in the scene with which the ray intersects
        let intersects = raycaster.intersectObjects(targets); // can pass scene children here too.

        // if there is one (or more) intersections
        if (intersects.length > 0) {
            this.newTrackTarget = intersects[0].object;
        }
        else {
            return;
        }

        // On target click, iterate the properties of the mesh
        let propertiesSelect = `<label style="margin: 0 5px;">${this.newTrackTarget.name}</label><select class="form-select" id="targetProperties1" style=""><option value="0"> -- Select Property -- <option>`;
        for(let property in this.newTrackTarget) {
            propertiesSelect += `<option>${property}</option>`;
        }
        propertiesSelect += '</select>';

        this.selectTargetElement.innerHTML = propertiesSelect;
        
        // Add events for checking for more properties. Display properties nested 1 more deep if so.
        this.selectTargetElement.querySelector('#targetProperties1').onchange = function (event) {
            if (Object.keys(this.newTrackTarget[event.target.value]).length) {
                let moreProperties = document.createElement('select');
                moreProperties.style.margin = '0 10px';
                moreProperties.classList.add('form-select');
                moreProperties.id = 'targetProperties2';
                moreProperties.innerHTML = '<option value="0"> ------ <option>';
                for (let property in this.newTrackTarget[event.target.value]) {
                    moreProperties.innerHTML += `<option>${property}</option>`;
                }
                this.selectTargetElement.appendChild(moreProperties);
            }
        }.bind(this);

        document.body.removeEventListener('mousedown', document.body);
    }
    /**
     * Read values from the inputs and construct a new Timeline object based on that.
     * @param {Event} event 
     */
    addTrackToTimeline(event) {
        let trackName = this.element.querySelector('#trackName').value;
        let trackType = this.element.querySelector('#trackType');
        let sampleRate = 1;
        let inputModifier = 1;
        trackType = trackType.options[trackType.selectedIndex].value;

        switch (trackType) {
            case 'channel':
                sampleRate = this.addTrackGui.querySelector('#sampleRate').value;
                inputModifier = this.addTrackGui.querySelector('#inputModifier').value;

                new NumberTrack(trackName, this.timeline, this.newTrackTarget, sampleRate, inputModifier);
                break;

            case 'keyframe':
                // Construct target object based on properties and add keyframe track.
                let property1 = this.element.querySelector('#targetProperties1');
                let property2 = this.element.querySelector('#targetProperties2');

                // Pass by reference requires object separation.
                let keyframeTrack = new KeyframeTrack(trackName, this.newTrackTarget[property1.value], this.timeline);
                keyframeTrack.keyframe({
                    [property2.value] : 0 // omg love you new ES.
                }, 0, "Linear.EaseNone")
                break;

            case 'position':
                sampleRate = this.addTrackGui.querySelector('#sampleRate').value;
                inputModifier = this.addTrackGui.querySelector('#inputModifier').value;

                new PositionTrack(trackName, this.timeline, this.newTrackTarget, sampleRate, inputModifier);
                break;
        }
    }
}

module.exports = Toolbar;