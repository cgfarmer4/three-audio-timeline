const Keyframe = require('./keyframe');
const Number = require('./number');
const VectorPosition = require('./vector');

const Tracks = {
    Keyframe: Keyframe,
    Number: Number,
    Position: VectorPosition
}

module.exports = Tracks;
