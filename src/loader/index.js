'use_strict';
const THREE = require('three');
const Audio = require('../audio');
const DracoModule = require('../../vendor/draco_decoder');
const DracoLoader = require('../../vendor/dracoLoader');
const EventEmitter = require('events').EventEmitter;

/**
 * 
 * Loader Example --->
 
 this.timeline.assets = new Timeline.Loader({
    'rising': {
        type: 'audio',
        url: 'examples/rising-sun/rising-sun_Ableton/RisingSunAmbixB.wav'
    },
    'sun': {
        type: 'texture',
        url: 'examples/rising-sun/sun-texture.jpg'
    },
    'astronaut': {
        type: 'draco',
        url: 'assets/astronaut.drc'
    }
})

this.timeline.assets.on('loading:complete', () => {})

 */

class Loader extends EventEmitter {
    constructor(assets) {
        super();
        
        this.assets = assets;
        this.numAssets = Object.keys(this.assets).length;
        this.loadedAssets = 0;

        for(let entity in this.assets) {
            let asset = this.assets[entity];
            let loader = this[asset.type](asset, entity);
        }

        this.on('loaded:texture', this.parseLoadEvent.bind(this));
        this.on('loaded:draco', this.parseLoadEvent.bind(this));
        this.on('loaded:audio', this.parseLoadEvent.bind(this));
        this.on('failed', this.parseFailedEvent.bind(this));
    }
    parseLoadEvent(event) {
        this.loadedAssets += 1;

        //update asset array with loaded asset
        this.assets[event.name] = event.data;

        //all events, emit complete
        if(this.loadedAssets === this.numAssets) {
            this.emit('loading:complete');
        }
        else {
            let progress = this.updateProgress();
            this.emit('loading:progress', progress);
        }
    }
    parseFailedEvent(event) {
        this.emit('loading:failed', event);
    }
    updateProgress() {
        this.progress = this.loadedAssets / this.numAssets;
    }
    texture(asset, name) {
        let self = this;
        let textureLoader = new THREE.TextureLoader();
        textureLoader.load(asset.url,
            function (texture) {
                self.emit('loaded:texture', {
                    asset: asset,
                    name: name,
                    data: texture
                });
            },
            function (event) {
                console.log((event.loaded / event.total * 100) + '% loaded');
            },
            function (error) {
                console.error('Error loading texture:', error);
                self.emit('failed', error);
            }
        );
    }
    draco(asset, name) {
        let self = this;
        let dracoLoader = new DracoLoader();
        dracoLoader.load(asset.url, (bufferGeometry) => {
                self.emit('loaded:draco', {
                    asset: asset,
                    name: name,
                    data: bufferGeometry
                });
            },
            function (event) {
                console.log((event.loaded / event.total * 100) + '% loaded');
            },
            function (error) {
                console.error("Draco loading failed:", error);
                self.emit('failed', error);
            }
        );
    }
    audio(asset, name) {
        let self = this;
        let audio = new Audio(asset.url, this);
        audio.on('loaded:audio', (audio) => {
            self.emit('loaded:audio', {
                asset: asset,
                name: name,
                data: audio
            });
        })

        audio.on('failed:audio', (error) => {
            self.emit('failed', error);
        })
    }
}

module.exports = Loader;
