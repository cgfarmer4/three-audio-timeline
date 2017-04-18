'use_strict';
const Easing = require('./easing.js');
const EventEmitter = require('events').EventEmitter

/**
 * Timeline to manage javascript elements and their properties per keyframe.
 * 
 * extends EventEmitter
 */
class Timeline extends EventEmitter {
    constructor() {
        super();
        this.name = "Global";
        this.tracks = [];
        this.targets = [];
        this.time = 0;
        this.totalTime = 0;
        this.loopCount = 0;
        this.loopMode = -1;
        this.playing = true;
    }
    /**
     * Possible values of n:
     * 
     * -1 infinite loop
     *  0  play forever without looping, continue increasing time even after last animation
     *  1  play once and stop at the time the last animation finishes
     * >1 loop n-times
     * 
     * @param {Number} n 
     */
    loop(n) {
        this.loopMode = n;
    }
    /**
     * Stop 
     */
    stop() {
        this.playing = false;
        this.time = 0;
    }
    /**
     * Pause
     */
    pause() {
        this.playing = false;
    }
    /**
     * Play
     */
    play() {
        this.playing = true;
    }
    /**
     * 
     * @param {Number} deltaTime 
     */
    update(deltaTime) {
        //Let the GUI know the Timeline changed.
        this.emit('update');

        if (this.playing) {
            this.totalTime += deltaTime;
            this.time += deltaTime;
        }

        //Update the keyframe nodes when the timeline loops back.
        if (this.loopMode !== 0) {
            let animationEnd = this.findAnimationEnd();

            if (this.time > animationEnd) {
                if (this.loopMode == -1 || (this.loopCount < this.loopMode)) {
                    this.time = 0;
                    this.loopCount++;

                    for (let i = 0; i < this.tracks.length; i++) {
                        if (!this.tracks[i].keysMap) continue;
                        let track = this.tracks[i];

                        for (let key in track.keysMap) {
                            let keys = track.keysMap[key].keys;
                            keys.forEach(function (key, index, returnArr) {
                                returnArr[index].hasStarted = false;
                                returnArr[index].hasEnded = false;
                            })

                            if (track.keysMap[key].following) {
                                track.keysMap[key].followKeys.forEach(function (key, index, returnArr) {
                                    returnArr[index].hasStarted = false;
                                    returnArr[index].hasEnded = false;
                                })
                            }
                        }
                    }
                }
                else {
                    this.playing = false;
                }
            }
        }

        this.applyValues();
    }
    /**
     * Iterate all of the tracks and check their end time. 
     * The end time has delay, duration properties.
     */
    findAnimationEnd() {
        let endTime = 0;

        for (let i = 0; i < this.tracks.length; i++) {
            if (this.tracks[i].endTime > endTime) {
                endTime = this.tracks[i].endTime;
            }
        }

        this.endTime = endTime;

        return endTime;
    }
    /**
     * Iterate animation values and apply the values with the proper duration and easing.
     */
    applyValues() {
        for (let i = 0; i < this.tracks.length; i++) {
            // If recording, check to see if in accordance with sample rate value
            // and ready for next tick in data saving.
            if (this.tracks[i].recording) {
                let recordingTrack = this.tracks[i];

                if (recordingTrack.nextTick > this.endTime) {
                    recordingTrack.nextTick = 0;
                }

                //- Calculate and check spot in array, if occupied, replace, if none, push.
                if (recordingTrack.nextTick >= this.time && this.playing) {
                    let dataIndex = Math.floor(recordingTrack.nextTick / recordingTrack.sampleRate);
                    let value = recordingTrack.getTargetValue()

                    //if first pass, set all init values up to that point to 0/null. 
                    //TODO: Change color of init dots or allow null values? Think we need nulls.
                    if (dataIndex !== 0 && !recordingTrack.data[dataIndex - 1]) {
                        for (let x = 0; x < dataIndex; x++) {
                            recordingTrack.data.push(null);
                        }
                        recordingTrack.data.push(value);
                    }
                    else if (recordingTrack.data[dataIndex] || recordingTrack.data[dataIndex] === null) {
                        recordingTrack.data[dataIndex] = value;
                    }
                    //else if values are there up to that point. just push
                    else {
                        recordingTrack.data.push(value)
                    }

                    recordingTrack.nextTick += recordingTrack.sampleRate;
                }
                
            }

            if (!this.tracks[i].keysMap) continue;

            //Iterate the keys in the track map
            for (let property in this.tracks[i].keysMap) {
                let keys = this.tracks[i].keysMap[property].keys;

                if (this.tracks[i].keysMap[property].following) {
                    keys = this.tracks[i].keysMap[property].followKeys
                }

                for (let z = 0; z < keys.length; z++) {
                    let currentTrack = keys[z];

                    if (this.time < currentTrack.startTime || currentTrack.hasEnded) {
                        continue;
                    }

                    if (this.time >= currentTrack.startTime && !currentTrack.hasStarted) {
                        let startValue = currentTrack.target[currentTrack.propertyName];
                        if (startValue.length && startValue.indexOf('px') > -1) {
                            currentTrack.startValue = Number(startValue.replace('px', ''));
                            currentTrack.unit = 'px';
                        }
                        else {
                            currentTrack.startValue = startValue;
                        }
                        currentTrack.hasStarted = true;
                    }

                    let duration = currentTrack.endTime - currentTrack.startTime;
                    let t = duration ? (this.time - currentTrack.startTime) / (duration) : 1;
                    let easeType = currentTrack.easing.substr(0, currentTrack.easing.indexOf("."));
                    let easeBezier = currentTrack.easing.substr(currentTrack.easing.indexOf(".") + 1, currentTrack.easing.length);

                    t = Math.max(0, Math.min(t, 1));
                    t = Easing[easeType][easeBezier](t);

                    let value = currentTrack.startValue + (currentTrack.endValue - currentTrack.startValue) * t;

                    if (currentTrack.unit) value += currentTrack.unit;
                    currentTrack.target[currentTrack.propertyName] = value;

                    if (currentTrack.parent && currentTrack.parent.onUpdateCallback) {
                        currentTrack.parent.onUpdateCallback(currentTrack);
                    }

                    if (this.time >= currentTrack.endTime && !currentTrack.hasEnded) {
                        currentTrack.hasEnded = true;
                    }

                    if (t == 1) {
                        if (this.loopMode == 0) {
                            this.tracks.splice(i, 1);
                            i--;
                        }
                    }
                }
            }
        }
    }
}

module.exports = Timeline;