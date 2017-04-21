'use_strict';
const Track = require('./track');

/**
 * Stores keyframe values based on editable properties.
 */
class Keyframe extends Track {
    constructor(name, target, timeline) {
        super(name, timeline);
        this.type = 'keyframe';
        this.target = target;

        this.labelHeight = 20;
        this.startTime = 0;
        this.endTime = 0;
        this.time = 0;
        this.keysMap = {};
        this.selectedProperty = "";

        this.on('follow:updateModifier', this.updateFollowingModifier.bind(this));
    }
    /**
     * Properties of each keyframe on creation. Referred to as keys elsewhere.
     * 
     * @param {*} properties 
     * @param {*} duration 
     * @param {*} easing 
     */
    keyframe(properties, duration, easing) {
        if (!easing) {
            easing = "Linear.EaseNone";
        }

        for (let propertyName in properties) {

            let keyframeInfo = {
                id: this.targetName + "." + propertyName,
                hasStarted: false,
                hasEnded: false,
                timeline: this.timeline,
                name: propertyName,
                targetName: this.targetName,
                target: this.target,
                propertyName: propertyName,
                endValue: properties[propertyName],
                duration: duration,
                startTime: this.endTime,
                time: this.endTime,
                endTime: this.endTime + duration,
                easing: easing,
                parent: this
            };

            if (!this.keysMap[keyframeInfo.name]) {
                this.keysMap[keyframeInfo.name] = {
                    keys: [],
                    following: false,
                    followTrack: {},
                    followType: '',
                    followingKeys: [],
                    position: 0
                };
            }

            this.keysMap[keyframeInfo.name].keys.push(keyframeInfo);
        }

        this.endTime += duration;

        return this;
    }
    rebuildKeysMapProperty(property, dataMap) {

        //Iterate the keys in each
        dataMap.keys.forEach((key, index, returnArr) => {
            returnArr[index].target = this.target;
            returnArr[index].parent = this;
            returnArr[index].hasStarted = false;
            returnArr[index].hasEnded = false;
        });

        //Following keys
        if (!this.keysMap[property]) {
            this.keysMap[property] = {
                keys: dataMap.keys,
                following: dataMap.following,
                followTrack: dataMap.followTrack,
                followType: dataMap.followType,
                followingKeys: dataMap.followingKeys,
                position: dataMap.position
            };
        }

        this.updateTrackEnd(property);
    }
    /**
     * Type of follow changed.
     */
    updateFollowingModifier() {
        let followKeyOptionSelected = document.querySelector('input[name="followKeysOptions"]:checked').value;
        this.keysMap[this.selectedProperty].followType = followKeyOptionSelected;
        this.setupKeysForFollowType(followKeyOptionSelected);
    }
    /**
     * The input track modified the following track so update the GUI to reflect that.
     * @param {Object} event 
     */
    updateFollowingTrack(event) {
        let followTracks = this.followableTracks;
        let propertyTrack = this.keysMap[this.selectedProperty]; //select followed track.

        //remove properties if deselected
        if (event.target.value === 'noFollow') {
            propertyTrack.following = false;
            propertyTrack.followKeys = [];
            propertyTrack.followTrack = {};
            propertyTrack.followType = '';
            this.endTime = this.oldEndTime;
            this.updateTrackEnd();

            return;
        }

        let followKeyOptionSelected = document.querySelector('input[name="followKeysOptions"]:checked').value;
        let selected = followTracks[event.target.value];

        if(selected.type === 'position') {
            this.followPropertyPosition();
        }

        propertyTrack.following = true;
        propertyTrack.followTrack = selected;
        propertyTrack.followType = followKeyOptionSelected;
        this.setupKeysForFollowType(followKeyOptionSelected);
        this.updateTrackEnd();
    }
    followPropertyPosition() {
        let followSelect = document.getElementById('followSelect');
        let positions = `<label for="radio4"> x </label>
                        <input name="followPropertyPosition" type="radio" id="radio4" value="x" checked=true>
                        <label for="radio5"> y </label>
                        <input name="followPropertyPosition" type="radio" id="radi5" value="y">
                        <label for="radio6"> z </label>
                        <input name="followPropertyPosition" type="radio" id="radio6" value="z">`;

        let positionOptions = document.createElement('div');
        positionOptions.id = 'positionOptions';
        positionOptions.innerHTML = positions;
        followSelect.parentNode.insertBefore(positionOptions, followSelect.nextSibling);
        this.followingPropertyPosition = 'x';
        
        positionOptions.onchange = (event) => {
            this.followingPropertyPosition = event.target.value;
            this.updateFollowingModifier();
        }
    }
    /**
     * Create keyframe tracks based on the follow type. 
     * @param {String} followType ignoreKeys, useValues
     */
    setupKeysForFollowType(followType) {
        if (!this.keysMap[this.selectedProperty].following) return;
        this.oldEndTime = this.endTime;
        let data = [];

        switch (followType) {

            //create a new keyframe at every sample point
            case 'ignoreKeys':
                let prevEndTime = 0;
                let easing = "Linear.EaseNone";
                let followTrack = this.keysMap[this.selectedProperty].followTrack;
                let duration = Number(followTrack.sampleRate);
                
                if(followTrack.type === 'position') {
                    data = followTrack.data[this.followingPropertyPosition];
                }
                else {
                    data = followTrack.data;
                }

                this.keysMap[this.selectedProperty].followKeys = [];

                data.forEach(function (dataPoint, index) {
                    let startValue = dataPoint;
                    let endValue = 0;

                    if (data.length < index + 1) {
                        endValue = data[this.track.data.length - 1];
                    }
                    else {
                        endValue = data[index];
                    }

                    let keyframeInfo = {
                        id: followTrack.targetName,
                        name: followTrack.targetName + " -> x",
                        targetName: followTrack.targetName,
                        hasStarted: false,
                        hasEnded: false,
                        timeline: this.timeline,
                        target: this.target,
                        propertyName: "x",
                        startValue: startValue,
                        endValue: endValue,
                        startTime: prevEndTime,
                        duration: duration,
                        time: prevEndTime,
                        endTime: prevEndTime + duration,
                        easing: easing,
                        parent: this,
                        followKey: true
                    };

                    prevEndTime += duration;
                    this.keysMap[this.selectedProperty].followKeys.push(keyframeInfo);
                }.bind(this))

                this.endTime = prevEndTime;
                break;

            //copy keyframes over and only update their values
            case 'useValues':
                let following = this.keysMap[this.selectedProperty].followTrack;
                this.keysMap[this.selectedProperty].followKeys = Object.assign([], this.keysMap[this.selectedProperty].keys);

                if (following.type === 'position') {
                    data = following.data[this.followingPropertyPosition];
                }
                else {
                    data = following.data;
                }

                this.keysMap[this.selectedProperty].followKeys.forEach((key, index, returnArr) => {
                    let followingTimeLength = following.sampleRate * data.length;

                    let startTimeIndex = Math.floor(key.startTime * following.sampleRate);
                    let endTimeIndex = Math.ceil(key.endTime * following.sampleRate)

                    if (endTimeIndex > data.length) {
                        endTimeIndex = data.length - 1;
                    }

                    returnArr[index].startValue = data[startTimeIndex];
                    returnArr[index].endValue = data[endTimeIndex];
                })

                break;

            default:
                break;
        }
    }
    /**
     * Iterate all of the keys and find the largest value. 
     * Then update the end of the track so we can update our animation.
     */
    updateTrackEnd(propertyToUpdate) {
        let keys = [];
        let endTime = 0;
        let selected = propertyToUpdate || this.selectedProperty;

        if (this.keysMap[selected].following) {
            keys = this.keysMap[selected].followKeys;
        }
        else {
            keys = this.keysMap[selected].keys;
        }

        keys.forEach((key) => {
            if (key.endTime > endTime) endTime = key.endTime;
        });

        this.endTime = endTime;
    }
    template() {
        return `<header>
                        <h2>${this.type} track</h2>
                        <h3>${this.targetName}.${this.selectedProperty}</h3>
                </header>
                <ul>
                    <li>Start: ${this.startTime}</li>
                    <li>End: ${this.endTime}</li>
                </ul>
                <div id="follow" style="padding: 10px">
                    <h4 style="margin: 0 0 10px 0;">Follow input</h4>
                    ${this.followableInput()}
                    ${this.followTypeRadio()}
                    <!--<input type="text" placeholder="modify follow value"></input>-->
                </div>
                <button class="mediumButton" id="trackRemove"> Remove Parent </button>
                `;
    }
    followableInput() {
        this.followableTracks = [];

        this.timeline.tracks.forEach((track) => {
            if (track.type === 'number') {
                this.followableTracks.push(track);
            }
            else if(track.type === 'position') {
                this.followableTracks.push(track);
            }
        })

        let followableOptions = '<select id="followSelect"><option value="noFollow"> ---------- </option>';

        this.followableTracks.forEach((track, index) => {
            let selected = this.keysMap[this.selectedProperty];
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
        let selected = this.keysMap[this.selectedProperty];
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
    detailsEvents() {
        let followInput = document.getElementById('followSelect');
        let followModifier = document.getElementById('followModifier');
        let trackRemove = document.getElementById('trackRemove');

        followInput.onchange = this.updateFollowingTrack.bind(this);

        followModifier.onclick = (event) => {
            this.keysMap[this.selectedProperty].followType = document.querySelector('input[name="followKeysOptions"]:checked').value;
            this.updateFollowingModifier();
        }

        trackRemove.onclick = (event) => {
            this.timeline.tracks.splice(this.timeline.tracks.indexOf(this), 1);
            document.getElementById('detailsView').remove();
        }
    }
}

module.exports = Keyframe;