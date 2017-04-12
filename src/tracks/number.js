'use_strict';

/**
 * Stores array of values from an input that is integers or floats.
 */
class Number {
    constructor(name, timeline, target, sampleRate) {
        this.id = name;
        this.targetName = name;
        this.timeline = timeline;
        this.target = target || {};
        this.type = 'number';
        this.data = [];
        this.currentValue = 0;
        this.labelHeight = 50;
        this.sampleRate = sampleRate || 1;
        this.min = 0;
        this.max = 100;
        this.data = [12, 14, 69, 29, 20.1, 4, 12, 15, 17, 20, 78, 100];
        this.timeline.tracks.push(this);
    }
}

module.exports = Number;
