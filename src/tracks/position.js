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
        this.min = -10;
        this.max = 10;

        this.data = {
            x: [-1, 0, 0, 0, 0, 0, 0, 0, -2, -10, 10, 5, 10, 10, 5, 1, 3.4, 4.0],
            y: [0, 0, 0, 0, -2, -10, 10, 5, 10, 1, 0, 0, 0, 0, 1.5, 10, 3.4, 4.0],
            z: [10, 2, 0, 0, 0, 0, 5, 10, 3.4, 4, 0, 0, 0, 0, -2, -10, 10, 1.72]
        }

        this.currentPosition = {
            x: 0,
            y: 0,
            z: 0
        };

        this.timeline.tracks.push(this);
    }
    template() {
        return `<header>
                    <h1>${this.track.type}</h1>
                </header>
                <ul>
                    <li>Name: ${this.track.targetName} </li>
                </ul>`;
    }
}

module.exports = Position;
