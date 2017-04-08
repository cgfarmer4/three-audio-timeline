'use_strict';
const EventEmitter = require('events').EventEmitter;

class Track extends EventEmitter{
    constructor(name, timeline) {
        super();
        this.id = name;
        this.targetName = name;
        this.keysMap = {};
        this.followKeysMap = {};
        this.timeline = timeline;
        this.timeline.tracks.push(this);
    }
}

module.exports = Track;
