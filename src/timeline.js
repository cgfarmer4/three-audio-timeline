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
        this.animations = [];
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

        //TEST THIS AND DOCUMENT
        if (this.loopMode !== 0) {
            var animationEnd = this.findAnimationEnd();
            if (this.time > animationEnd) {
                if (this.loopMode == -1 || (this.loopCount < this.loopMode)) {
                    this.time = 0;
                    this.loopCount++;
                    for (var i = 0; i < this.animations.length; i++) {
                        this.animations[i].hasStarted = false;
                        this.animations[i].hasEnded = false;
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
     * Iterate all of the animations and check their end time. 
     * The end time has delay, duration properties.
     */
    findAnimationEnd() {
        let endTime = 0;
        
        for (let i = 0; i < this.animations.length; i++) {
            if (this.animations[i].endTime > endTime) {
                endTime = this.animations[i].endTime;
            }
        }

        return endTime;
    }
    /**
     * Iterate animation values and apply the values with the proper duration and easing.
     */
    applyValues() {
        for (let i = 0; i < this.animations.length; i++) {
            let currentAnimation = this.animations[i];

            if (this.time < currentAnimation.startTime || currentAnimation.hasEnded) {
                continue;
            }

            if (this.time >= currentAnimation.startTime && !currentAnimation.hasStarted) {
                let startValue = currentAnimation.target[currentAnimation.propertyName];
                if (startValue.length && startValue.indexOf('px') > -1) {
                    currentAnimation.startValue = Number(startValue.replace('px', ''));
                    currentAnimation.unit = 'px';
                }
                else {
                    currentAnimation.startValue = Number(startValue);
                }
                currentAnimation.hasStarted = true;
                if (currentAnimation.onStart) {
                    currentAnimation.onStart();
                }
            }

            let duration = currentAnimation.endTime - currentAnimation.startTime;
            let t = duration ? (this.time - currentAnimation.startTime) / (duration) : 1;
            let easeType = currentAnimation.easing.substr(0, currentAnimation.easing.indexOf("."));
            let easeBezier = currentAnimation.easing.substr(currentAnimation.easing.indexOf(".") + 1, currentAnimation.easing.length);

            t = Math.max(0, Math.min(t, 1));
            t = Easing[easeType][easeBezier](t);

            let value = currentAnimation.startValue + (currentAnimation.endValue - currentAnimation.startValue) * t;

            if (currentAnimation.unit) value += currentAnimation.unit;
            currentAnimation.target[currentAnimation.propertyName] = value;

            if (currentAnimation.parent && currentAnimation.parent.onUpdateCallback) {
                currentAnimation.parent.onUpdateCallback(currentAnimation);
            }

            if (this.time >= currentAnimation.endTime && !currentAnimation.hasEnded) {
                currentAnimation.hasEnded = true;
                if (currentAnimation.onEnd) {
                    currentAnimation.onEnd();
                }
            }

            if (t == 1) {
                if (this.loopMode == 0) {
                    this.animations.splice(i, 1);
                    i--;
                }
            }
        }
    }
}

module.exports = Timeline;
