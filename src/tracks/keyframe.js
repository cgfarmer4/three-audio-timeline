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

        this.on('follow:update', this.updateFollowingTrack.bind(this));
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
    /**
     * Type of follow changed.
     * 
     * @param {Object} eventData 
     */
    updateFollowingModifier(event) {
        let followKeyOptionSelected = document.querySelector('input[name="followKeysOptions"]:checked').value;
        this.keysMap[this.selectedProperty].followType = followKeyOptionSelected;
        this.setupKeysForFollowType(followKeyOptionSelected);
    }
    /**
     * The input track modified the following track so update the GUI to reflect that.
     * 
     * @param {Object} eventData 
     */
    updateFollowingTrack(eventData) {
        let followTracks = eventData.followableTracks;
        let propertyTrack = this.keysMap[this.selectedProperty]; //select followed track.
        let event = eventData.event;

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

        
        propertyTrack.following = true;
        propertyTrack.followTrack = selected;
        propertyTrack.followType = followKeyOptionSelected;
        this.setupKeysForFollowType(followKeyOptionSelected);
        this.updateTrackEnd();
    }
    /**
     * Create keyframe tracks based on the follow type. 
     * 
     * @param {String} followType ignoreKeys, useValues
     */
    setupKeysForFollowType(followType) {
        if (!this.keysMap[this.selectedProperty].following) return;
        this.oldEndTime = this.endTime;

        switch (followType) {

            //create a new keyframe at every sample point
            case 'ignoreKeys':
                let prevEndTime = 0;
                let easing = "Linear.EaseNone";
                let followTrack = this.keysMap[this.selectedProperty].followTrack;
                let duration = followTrack.sampleRate;
                this.keysMap[this.selectedProperty].followKeys = [];

                followTrack.data.forEach(function (dataPoint, index) {
                    let startValue = dataPoint;
                    let endValue = 0;

                    if (followTrack.data.length < index + 1) {
                        endValue = followTrack.data[this.track.followTrack.data.length - 1];
                    }
                    else {
                        endValue = followTrack.data[index];
                    }

                    let keyframeInfo = {
                        id: followTrack.targetName,
                        name: followTrack.targetName + " -> x",
                        targetName: followTrack.targetName,
                        hasStarted: false,
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

                this.keysMap[this.selectedProperty].followKeys.forEach((key, index, returnArr) => {
                    let followingTimeLength = following.sampleRate * following.data.length;

                    let startTimeIndex = Math.floor(key.startTime * following.sampleRate);
                    let endTimeIndex = Math.ceil(key.endTime * following.sampleRate)

                    if (endTimeIndex > following.data.length) {
                        endTimeIndex = following.data.length - 1;
                    }

                    returnArr[index].startValue = following.data[startTimeIndex];
                    returnArr[index].endValue = following.data[endTimeIndex];
                })

                break;

            default:
                break;
        }
    }
    /**
     * Iterate all of the keys and find the largest value. 
     * Then update the end of the track so we can update our animation.
     * 
     */
    updateTrackEnd() {
        let keys = [];
        let endTime = 0;

        if (this.keysMap[this.selectedProperty].following) {
            keys = this.keysMap[this.selectedProperty].followKeys;
        }
        else {
            keys = this.keysMap[this.selectedProperty].keys;
        }

        keys.forEach((key) => {
            if(key.endTime > endTime) endTime = key.endTime;
        });

        this.endTime = endTime;
    }
}

module.exports = Keyframe;