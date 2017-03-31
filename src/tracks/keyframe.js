'use_strict';

/**
 * Stores keyframe values based on editable properties.
 */
class Keyframe {
    constructor(name, target, timeline) {
        this.name = name;
        this.target = target;
        this.timeline = timeline;
        
        this.startTime = 0;
        this.endTime = 0;
        this.time = 0;
    }
    /**
     * 
     * @param {*} delay 
     * @param {*} properties 
     * @param {*} duration 
     * @param {*} easing 
     */
    keyframe(delay, properties, duration, easing) {
        if (!easing) {
            easing = "Linear.EaseNone";
        }

        for (let propertyName in properties) {

            let keyframeInfo = {
                hasStarted: false,
                timeline: this.timeline,
                targetName: this.name,
                target: this.target,
                propertyName: propertyName,
                endValue: properties[propertyName],
                delay: delay,
                startTime: this.timeline.time + delay + this.endTime,
                endTime: this.timeline.time + delay + this.endTime + duration,
                easing: easing,
                parent: this,
                onStart: () => { },
                onEnd: () => { }
            };

            this.timeline.animations.push(keyframeInfo);
        }

        this.endTime += delay + duration;
        return this;
    }
}

module.exports = Keyframe;