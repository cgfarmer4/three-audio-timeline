'use_strict'

const EventEmitter = require('events').EventEmitter;
const Omnitone = require('omnitone').Omnitone;

class OmnitoneAudioPlayback extends EventEmitter {
    constructor(audioUrl) {
        super();
        this.renderer = this.foaRenderer(audioUrl);
    }
    foaRenderer(audioUrl) {
        // Set up an audio element to feed the ambisonic source audio feed.
        this.audioElement = document.createElement('audio');
        this.audioElement.src = audioUrl;

        let AudioContext = window.AudioContext // Default
            || window.webkitAudioContext // Safari and old versions of Chrome
            || false; 

        // Create AudioContext, MediaElementSourceNode and FOARenderer.
        let audioContext = new AudioContext();
        let audioElementSource = audioContext.createMediaElementSource(this.audioElement);

        let foaRenderer = Omnitone.createFOARenderer(audioContext, {
            HRIRUrl: 'https://cdn.rawgit.com/GoogleChrome/omnitone/962089ca/build/resources/sh_hrir_o_1.wav'
        });

        // Make connection and start play.
        foaRenderer.initialize().then(() => {
            audioElementSource.connect(foaRenderer.input);
            foaRenderer.output.connect(audioContext.destination);
            this.emit('loaded:audio', foaRenderer);
        }, function (audioError) {
            console.error('Error loading audio:', audioError);
            this.emit('failed:audio', audioError);
        });
    }
}

module.exports = OmnitoneAudioPlayback;
