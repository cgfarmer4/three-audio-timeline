'use_strict';

/**
 * Stores array of values for a 3D element's positiioning.
 */
class Position {
    constructor(name, timeline) {
        this.id = name;
        this.targetName = name;
        this.timeline = timeline;
        this.labelHeight = 90;
        this.type = 'position';
        this.sampleRate = 1;

        this.data = {
            x: [0, 0, 0, 0, 0, 0, 0, 0, -2, -10, 10, 50, 100, 120, 150, 100, 34, 40],
            y: [0, 0, 0, 0, -2, -10, 10, 50, 100, 120, 0, 0, 0, 0, 150, 100, 34, 40],
            z: [100, 120, 0, 0, 0, 0, 150, 100, 34, 40, 0, 0, 0, 0, -2, -10, 10, 172]
        }

        this.currentPosition = {
            x: 0,
            y: 0,
            z: 0
        };

        this.timeline.tracks.push(this);
    }
}

module.exports = Position;
