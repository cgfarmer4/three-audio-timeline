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
                        if (!this.tracks[i].keys) continue;
                        this.tracks[i].keys.forEach(function(key, index, returnArr) {
                            returnArr[index].hasStarted = false;
                            returnArr[index].hasEnded = false;
                        })
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

        return endTime;
    }
    /**
     * Iterate animation values and apply the values with the proper duration and easing.
     */
    applyValues() {
        for (let i = 0; i < this.tracks.length; i++) {this.tracks[i].keys
            if(!this.tracks[i].keys) continue;
            for (let z = 0; z < this.tracks[i].keys.length; z++) {
                let currentTrack = this.tracks[i].keys[z];

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
                        currentTrack.startValue = Number(startValue);
                    }
                    currentTrack.hasStarted = true;
                    if (currentTrack.onStart) {
                        currentTrack.onStart();
                    }
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
                    if (currentTrack.onEnd) {
                        currentTrack.onEnd();
                    }
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

module.exports = Timeline;
