'use_strict';
const Easing = require('./easing.js');

class Anim {
    constructor(name, target, timeline) {
        this.startTime = 0;
        this.endTime = 0;
        this.time = 0;
        this.propertyAnims = [];
        this.hasStarted = false;
        this.hasEnded = false;

        this.name = name;
        this.target = target;
        this.timeline = timeline;
        this.animGroups = [];
    }
    to() {
        let args = [];
        for (let i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        let delay;
        let properties;
        let duration;
        let easing;

        if (typeof (args[0]) == "number") {
            delay = args.shift();
        }
        else {
            delay = 0;
        }

        if (typeof (args[0]) == "object") {
            properties = args.shift();
        }
        else {
            properties = {};
        }

        if (typeof (args[0]) == "number") {
            duration = args.shift();
        }
        else {
            duration = 1;
        }

        if (typeof (args[0]) == "function") {
            easing = args.shift();
        }
        else {
            easing = Easing.Linear.EaseNone;
        }

        let animGroup = [];
        let nop = function () { }

        for (let propertyName in properties) {
            let animInfo = {
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
                onStart: nop,
                onEnd: nop
            };
            this.timeline.anims.push(animInfo);
            animGroup.push(animInfo);
        }
        this.animGroups.push(animGroup);
        this.endTime += delay + duration;
        return this;
    }
    onStart (callback) {
        var currentAnimGroup = this.animGroups[this.animGroups.length - 1];
        if (!currentAnimGroup) return;

        var called = false;

        currentAnimGroup.forEach(function (anim) {
            anim.onStart = function () {
                if (!called) {
                    called = true;
                    callback();
                }
            };
        })

        return this;
    }
    onUpdate (callback) {
        var self = this;
        this.onUpdateCallback = function () {
            callback();
        };
        return this;
    }
    onEnd (callback) {
        var currentAnimGroup = this.animGroups[this.animGroups.length - 1];
        if (!currentAnimGroup) return;

        var called = false;

        currentAnimGroup.forEach(function (anim) {
            anim.onEnd = function () {
                if (!called) {
                    called = true;
                    callback();
                }
            }
        })

        return this;
    }

}

module.exports = Anim;
