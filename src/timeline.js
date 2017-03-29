'use_strict';

class Timeline {
    constructor() {
        this.name = "Global";
        this.anims = [];
        this.time = 0;
        this.totalTime = 0;
        this.loopCount = 0;
        this.loopMode = 0;
        this.playing = true;
        var self = this;
        this.fps = 30;
        this.loopInterval = setInterval(function () {
            self.update();
        }, 1000 / this.fps);
    }
    /**
     * Possible values of n:
     * 
     * -1 infinite loop
     *  0  play forever without looping, continue increasing time even after last animation
     *  1  play once and stop at the time the last animation finishes
     * >1 loop n-times
     * 
     */
    loop(n) {
        this.loopMode = n;
    }
    stop() {
        this.playing = false;
        this.time = 0;
    }
    pause() {
        this.playing = false;
    }
    play() {
        this.playing = true;
    }
    preUpdate() {
        //placeholder for hooks like GUI rendering
    }
    update(deltaTime) {
        if (deltaTime !== undefined) {
            if (this.loopInterval !== 0) {
                clearInterval(this.loopInterval);
                this.loopInterval = 0;
            }
        }
        else {
            deltaTime = 1 / this.fps;
        }

        this.preUpdate();

        if (this.playing) {
            this.totalTime += deltaTime;
            this.time += deltaTime;
        }

        if (this.loopMode !== 0) {
            var animationEnd = this.findAnimationEnd();
            if (this.time > animationEnd) {
                if (this.loopMode == -1 || (this.loopCount < this.loopMode)) {
                    this.time = 0;
                    this.loopCount++;
                    for (var i = 0; i < this.anims.length; i++) {
                        this.anims[i].hasStarted = false;
                        this.anims[i].hasEnded = false;
                    }
                }
                else {
                    this.playing = false;
                }
            }
        }

        this.applyValues();
    }
    findAnimationEnd() {
        var endTime = 0;
        for (var i = 0; i < this.anims.length; i++) {
            if (this.anims[i].endTime > endTime) {
                endTime = this.anims[i].endTime;
            }
        }
        return endTime;
    }
    applyValues() {
        for (var i = 0; i < this.anims.length; i++) {
            var propertyAnim = this.anims[i];
            if (this.time < propertyAnim.startTime || propertyAnim.hasEnded) {
                continue;
            }
            if (this.time >= propertyAnim.startTime && !propertyAnim.hasStarted) {
                var startValue = propertyAnim.target[propertyAnim.propertyName];
                if (startValue.length && startValue.indexOf('px') > -1) {
                    propertyAnim.startValue = Number(startValue.replace('px', ''));
                    propertyAnim.unit = 'px';
                }
                else {
                    propertyAnim.startValue = Number(startValue);
                }
                propertyAnim.hasStarted = true;
                if (propertyAnim.onStart) {
                    propertyAnim.onStart();
                }
            }
            var duration = propertyAnim.endTime - propertyAnim.startTime;
            var t = duration ? (this.time - propertyAnim.startTime) / (duration) : 1;
            t = Math.max(0, Math.min(t, 1));
            t = propertyAnim.easing(t);

            var value = propertyAnim.startValue + (propertyAnim.endValue - propertyAnim.startValue) * t;

            if (propertyAnim.unit) value += propertyAnim.unit;
            propertyAnim.target[propertyAnim.propertyName] = value;

            if (propertyAnim.parent && propertyAnim.parent.onUpdateCallback) {
                propertyAnim.parent.onUpdateCallback(propertyAnim);
            }

            if (this.time >= propertyAnim.endTime && !propertyAnim.hasEnded) {
                propertyAnim.hasEnded = true;
                if (propertyAnim.onEnd) {
                    propertyAnim.onEnd();
                }
            }

            if (t == 1) {
                if (this.loopMode == 0) {
                    this.anims.splice(i, 1);
                    i--;
                }
            }
        }
    }
}

module.exports = Timeline;
