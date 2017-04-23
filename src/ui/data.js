/**
 * Export, Save, Load
 */
module.exports = DataUtils = {
    exportCode: function () {
        var code = "";

        for (var i = 0; i < this.timeline.tracks.length; i++) {
            var track = this.timeline.tracks[i];
            if (track.type == "object") continue;
            if (track.anims.length === 0) continue;
            code += 'anim("' + track.parent.name + '",' + track.parent.name + ')';
            for (var j = 0; j < track.anims.length; j++) {
                var anim = track.anims[j];
                code += '.to(';
                if (anim.delay)
                    code += anim.delay + ',';
                code += '{' + '"' + anim.propertyName + '"' + ':' + anim.endValue + '}';
                code += ',' + (anim.endTime - anim.startTime);
                if (anim.easing != "Linear.EaseNone")
                    code += ', Easing.' + anim.easing;
                code += ')';
                //code += '.to(' + anim.delay + ',{' + '"' + anim.propertyName + '"' + ':' + anim.endValue + '} ')';
            }
            code += ';\n';
        }

        prompt("Copy this:", code);
    },
    save: function () {
        var data = {};

        for (var i = 0; i < this.timeline.tracks.length; i++) {
            let track = this.timeline.tracks[i];
            let keysData = [];
            data[track.id] = keysData;
            if (!track.keys) continue;
            for (var j = 0; j < track.keys.length; j++) {
                keysData.push({
                    time: track.keys[j].time,
                    value: track.keys[j].value,
                    easing: track.keys[j].easing
                });
            }
        }

        localStorage["timeline.js.settings.canvasHeight"] = this.canvasHeight;
        localStorage["timeline.js.settings.timeScale"] = this.timeScale;
        localStorage["timeline.js.data." + this.timeline.name] = JSON.stringify(data);
    },
    load: function () {
        if (localStorage["timeline.js.settings.canvasHeight"]) {
            this.canvasHeight = localStorage["timeline.js.settings.canvasHeight"];
        }
        if (localStorage["timeline.js.settings.timeScale"]) {
            this.timeScale = localStorage["timeline.js.settings.timeScale"];
        }

        var dataString = localStorage["timeline.js.data." + this.timeline.name];
        if (!dataString) return;
        var data = JSON.parse(dataString);

        for (var i = 0; i < this.timeline.tracks.length; i++) {
            var track = this.timeline.tracks[i];
            if (!data[track.id]) {
                continue;
            }
            if (track.type == "keyframe") {
                var keysData = data[track.id];
                track.keys = [];

                for (var j = 0; j < keysData.length; j++) {
                    track.keys.push({
                        time: keysData[j].time,
                        value: keysData[j].value,
                        easing: Easing[keysData[j].easing],
                        track: track
                    });
                }
                this.rebuildTrackAnimsFromKeys(track);
            }
        }
    }
}
