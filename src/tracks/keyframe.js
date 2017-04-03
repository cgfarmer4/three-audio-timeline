'use_strict';

/**
 * Stores keyframe values based on editable properties.
 */
class Keyframe {
    constructor(name, target, timeline) {
        this.id = name;
        this.type = 'keyframe';
        this.targetName = name;
        this.target = target;
        this.timeline = timeline;
        
        this.labelHeight = 20;
        this.startTime = 0;
        this.endTime = 0;
        this.time = 0;
        this.keys = [];
        this.timeline.tracks.push(this);
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
                id: this.targetName + "." + propertyName,
                hasStarted: false,
                timeline: this.timeline,
                name: propertyName,
                targetName: this.targetName,
                target: this.target,
                propertyName: propertyName,
                endValue: properties[propertyName],
                delay: delay,
                startTime: this.timeline.time + delay + this.endTime,
                time: this.timeline.time + delay + this.endTime,
                endTime: this.timeline.time + delay + this.endTime + duration,
                easing: easing,
                parent: this,
                onStart: () => { },
                onEnd: () => { }
            };

            this.keys.push(keyframeInfo);
        }

        this.endTime += delay + duration;
        return this;
    }
}

module.exports = Keyframe;