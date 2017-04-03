'use_strict';

const Easing = require('./easing.js');

/**
 * Draw and manage timeline view.
 * @param {Timeline} timeline
 */
class TimelineGui {
    constructor(timeline) {
        this.timeline = timeline;
        this.trackLabelWidth = 108;
        this.trackLabelHeight = 20;
        this.tracksScrollWidth = 16;
        this.tracksScrollHeight = 0;
        this.tracksScrollThumbPos = 0;
        this.tracksScrollThumbHeight = 0;
        this.tracksScrollY = 0;
        this.timeScrollWidth = 0;
        this.timeScrollHeight = 16;
        this.timeScrollThumbPos = 0;
        this.timeScrollThumbWidth = 0;
        this.timeScrollX = 0;
        this.headerHeight = 30;
        this.canvasHeight = 200;
        this.yshift = this.headerHeight;
        this.draggingTime = false;
        this.draggingTracksScrollThumb = false;
        this.draggingTimeScrollThumb = false;
        this.draggingKeys = false;
        this.draggingTimeScale = false;
        this.selectedKeys = [];
        this.timeScale = 1;
        this.trackNameCounter = 0;
        // this.load();

        //Main Timeline Canvas Container
        this.container = document.createElement("div");
        this.container.style.width = "100%";
        this.container.style.height = this.canvasHeight + "px";
        this.container.style.background = "#EEEEEE";
        this.container.style.position = "fixed";
        this.container.style.left = "0px";
        this.container.style.bottom = "0px";
        document.body.appendChild(this.container);

        this.addSplitter.call(this);

        //Canvas Element
        this.canvas = document.createElement("canvas");
        this.c = this.canvas.getContext("2d");
        this.canvas.width = 0;
        this.container.appendChild(this.canvas);

        //- GUI Events
        this.timeline.on('update', this.updateGUI.bind(this));
        this.canvas.onclick = this.onMouseClick.bind(this);
        this.canvas.onmousedown = this.onMouseDown.bind(this);
        this.canvas.onmousemove = this.onCanvasMouseMove.bind(this);
        this.canvas.ondblclick = this.onMouseDoubleClick.bind(this);
        this.canvas.onmouseup = this.onMouseUp.bind(this);
        this.canvas.onmouseout = this.onMouseUp.bind(this);

        this.updateGUI();
        this.buildInputDialog();
    }
    /**
     * Resize bar just above the GUI canvas.
     */
    addSplitter() {
        let self = this;
        this.splitter = document.createElement("div");
        this.splitter.style.width = "100%";
        this.splitter.style.height = "4px";
        this.splitter.style.cursor = "ns-resize";
        this.splitter.style.position = "fixed";
        this.splitter.style.left = "0px";
        this.splitter.style.bottom = (this.canvasHeight - 2) + "px";
        this.splitter.addEventListener("mousedown", function () {
            function mouseMove(e) {
                var h = (window.innerHeight - e.clientY);
                self.splitter.style.bottom = (h - 2) + "px";
                self.container.style.height = h + "px";
                self.canvasHeight = h;
                self.tracksScrollY = 0;
                self.tracksScrollThumbPos = 0;
                self.save();
            }
            function mouseUp(e) {
                document.body.removeEventListener("mousemove", mouseMove, false);
                document.body.removeEventListener("mouseup", mouseUp, false);
            }
            document.body.addEventListener("mousemove", mouseMove, false);
            document.body.addEventListener("mouseup", mouseUp, false);
        }, false);
        document.body.appendChild(this.splitter);
    }
    /**
     * 
     * @param {*} event 
     */
    onMouseDown(event) {
        this.heightMap = [];

        let x = event.layerX;
        let y = event.layerY;

        if (x > this.trackLabelWidth && y < this.headerHeight) {
            //timeline
            this.draggingTime = true;
            this.onCanvasMouseMove(event);
        }
        else if (x > this.canvas.width - this.tracksScrollWidth && y > this.headerHeight) {
            //tracks scroll
            if (y >= this.headerHeight + this.tracksScrollThumbPos && y <= this.headerHeight + this.tracksScrollThumbPos + this.tracksScrollThumbHeight) {
                this.tracksScrollThumbDragOffset = y - this.headerHeight - this.tracksScrollThumbPos;
                this.draggingTracksScrollThumb = true;
            }
        }
        else if (x > this.trackLabelWidth && y > this.headerHeight && y < this.canvasHeight - this.timeScrollHeight) {
            //keys
            this.selectKeys(event.layerX, event.layerY);
            if (this.selectedKeys.length > 0) {
                this.draggingKeys = true;
            }

            this.cancelKeyClick = false;
        }
        else if (x < this.trackLabelWidth && y > this.canvasHeight - this.timeScrollHeight) {
            //time scale
            this.timeScale = Math.max(0.01, Math.min((this.trackLabelWidth - x) / this.trackLabelWidth, 1));
            this.draggingTimeScale = true;
            this.save();
        }
        else if (x > this.trackLabelWidth && y > this.canvasHeight - this.timeScrollHeight) {
            //time scroll
            if (x >= this.trackLabelWidth + this.timeScrollThumbPos && x <= this.trackLabelWidth + this.timeScrollThumbPos + this.timeScrollThumbWidth) {
                this.timeScrollThumbDragOffset = x - this.trackLabelWidth - this.timeScrollThumbPos;
                this.draggingTimeScrollThumb = true;
            }
        }
    }
    /**
     * 
     * @param {*} event 
     */
    onCanvasMouseMove(event) {
        var x = event.layerX;
        var y = event.layerY;

        if(this.draggingKeys) {
            for (let i = 0; i < this.selectedKeys.length; i++) {
                let draggedKey = this.selectedKeys[i];
                draggedKey.startTime = Math.max(0, this.xToTime(x));
                this.sortTrackKeys(draggedKey.parent);
            }
            this.cancelKeyClick = true;
            this.timeScrollThumbPos = this.timeScrollX * (this.timeScrollWidth - this.timeScrollThumbWidth);
        }

        if (this.draggingTime) {
            this.timeline.time = this.xToTime(x);
            var animationEnd = this.timeline.findAnimationEnd();
            if (this.timeline.time < 0) this.timeline.time = 0;
            if (this.timeline.time > animationEnd) this.timeline.time = animationEnd;
        }

        if (this.draggingTimeScale) {
            this.timeScale = Math.max(0.01, Math.min((this.trackLabelWidth - x) / this.trackLabelWidth, 1));
            this.save();
        }

        if (this.draggingTracksScrollThumb) {
            this.tracksScrollThumbPos = y - this.headerHeight - this.tracksScrollThumbDragOffset;
            if (this.tracksScrollThumbPos < 0) {
                this.tracksScrollThumbPos = 0;
            }
            if (this.tracksScrollThumbPos + this.tracksScrollThumbHeight > this.tracksScrollHeight) {
                this.tracksScrollThumbPos = Math.max(0, this.tracksScrollHeight - this.tracksScrollThumbHeight);
            }
            if (this.tracksScrollHeight - this.tracksScrollThumbHeight > 0) {
                this.tracksScrollY = this.tracksScrollThumbPos / (this.tracksScrollHeight - this.tracksScrollThumbHeight);
            }
            else {
                this.tracksScrollY = 0;
            }
        }

        if (this.draggingTimeScrollThumb) {
            this.timeScrollThumbPos = x - this.trackLabelWidth - this.timeScrollThumbDragOffset;
            if (this.timeScrollThumbPos < 0) {
                this.timeScrollThumbPos = 0;
            }
            if (this.timeScrollThumbPos + this.timeScrollThumbWidth > this.timeScrollWidth) {
                this.timeScrollThumbPos = Math.max(0, this.timeScrollWidth - this.timeScrollThumbWidth);
            }
            if (this.timeScrollWidth - this.timeScrollThumbWidth > 0) {
                this.timeScrollX = this.timeScrollThumbPos / (this.timeScrollWidth - this.timeScrollThumbWidth);
            }
            else {
                this.timeScrollX = 0;
            }
        }
    }
    /**
     * 
     * @param {*} evet 
     */
    onMouseUp(evet) {
        if (this.draggingTime) {
            this.draggingTime = false;
        }
        if (this.draggingKeys) {
            this.draggingKeys = false;
        }
        if (this.draggingTracksScrollThumb) {
            this.draggingTracksScrollThumb = false;
        }
        if (this.draggingTimeScale) {
            this.draggingTimeScale = false;
        }
        if (this.draggingTimeScrollThumb) {
            this.draggingTimeScrollThumb = false;
        }
    }
    /**
     * 
     * @param {*} event 
     */
    onMouseClick(event) {
        if (event.layerX < 1 * this.headerHeight - 4 * 0 && event.layerY < this.headerHeight) {
            this.timeline.play();
        }
        if (event.layerX > 1 * this.headerHeight - 4 * 0 && event.layerX < 2 * this.headerHeight - 4 * 1 && event.layerY < this.headerHeight) {
            this.timeline.pause();
        }

        if (event.layerX > 2 * this.headerHeight - 4 * 1 && event.layerX < 3 * this.headerHeight - 4 * 2 && event.layerY < this.headerHeight) {
            this.timeline.stop();
        }

        if (event.layerX > 3 * this.headerHeight - 4 * 2 && event.layerX < 4 * this.headerHeight - 4 * 3 && event.layerY < this.headerHeight) {
            this.exportCode();
        }

        if (this.selectedKeys.length > 0 && !this.cancelKeyClick) {
            this.showKeyEditDialog(event.pageX, event.pageY);
        }
    }
    /**
     * 
     * @param {*} evet 
     */
    onMouseDoubleClick(evet) {
        var x = event.layerX;
        var y = event.layerY;

        if (x > this.trackLabelWidth && y < this.headerHeight) {
            //timeline
            var timeStr = prompt("Enter time") || "0:0:0";
            var timeArr = timeStr.split(":");
            var seconds = 0;
            var minutes = 0;
            var hours = 0;
            if (timeArr.length > 0) seconds = parseInt(timeArr[timeArr.length - 1], 10);
            if (timeArr.length > 1) minutes = parseInt(timeArr[timeArr.length - 2], 10);
            if (timeArr.length > 2) hours = parseInt(timeArr[timeArr.length - 3], 10);
            this.time = this.timeline.totalTime = hours * 60 * 60 + minutes * 60 + seconds;
        }
        else if (x > this.trackLabelWidth && this.selectedKeys.length === 0 && y > this.headerHeight && y < this.canvasHeight - this.timeScrollHeight) {
            this.addKeyAt(x, y);
        }
    }
    /**
     * 
     * @param {*} mouseX 
     * @param {*} mouseY 
     */
    addKeyAt(mouseX, mouseY) {
        let selectedTrack = this.getTrackAt(mouseX, mouseY);
        let selectedKeys = selectedTrack.target.keys;

        if (!selectedTrack) {
            return;
        }

        var newKey = {
            time: this.xToTime(mouseX),
            value: selectedTrack.key.endValue,
            easing: "Linear.EaseNone",
            track: selectedTrack
        };

        if (selectedKeys.length === 0) {
            selectedKeys.push(newKey);
        }
        else if (newKey.time < selectedKeys[0].time) {
            newKey.value = selectedKeys[0].value;
            selectedKeys.unshift(newKey);
        }
        else if (newKey.time > selectedKeys[selectedKeys.length - 1].time) {
            newKey.value = selectedKeys[selectedKeys.length - 1].value;
            selectedKeys.push(newKey);
        }
        else for (var i = 1; i < selectedKeys.length; i++) {
            if (selectedKeys[i].time > newKey.time) {
                var k = (selectedKeys[i].time - newKey.time) / (selectedKeys[i].time - selectedKeys[i - 1].time);
                var delta = selectedKeys[i].value - selectedKeys[i - 1].value;
                newKey.easing = selectedKeys[i - 1].easing;
                var easeType = newKey.easing.substr(0, newKey.easing.indexOf("."));
                var easeBezier = newKey.easing.substr(newKey.easing.indexOf(".") + 1, newKey.easing.length);

                newKey.value = selectedKeys[i - 1].value + delta * Easing[easeType][easeBezier](k);
                selectedKeys.splice(i, 0, newKey);
                break;
            }
        }
        this.selectedKeys = [newKey];
        this.rebuildSelectedTracks();
    }
    /**
     * 
     * @param {*} mouseX 
     * @param {*} mouseY 
     */
    getTrackAt(mouseX, mouseY) {
        this.heightMap = [];
        this.currentY = this.headerHeight;

        this.timeline.tracks.forEach((track) => {
            
            switch(track.type) {
                case 'number':
                    this.heightMap.push({
                        type: 'number',
                        target: track,
                        startY: this.currentY,
                        endY: this.currentY + track.labelHeight
                    });
                    this.currentY += track.labelHeight;
                    break;

                case 'keyframe':
                    let keysMap = {};
                    track.keys.forEach((key, index) => {
                        if (!keysMap[key.name]) {
                            keysMap[key.name] = track.keys[index];
                        }
                    })

                    this.heightMap.push({
                        type: 'label',
                        target: track,
                        startY: this.currentY,
                        endY: this.currentY + track.labelHeight
                    });

                    this.currentY += track.labelHeight;

                    for (let key in keysMap) {

                        this.heightMap.push({
                            type: keysMap[key].parent.type,
                            target: keysMap[key].parent,
                            key: keysMap[key],
                            startY: this.currentY,
                            endY: this.currentY + track.labelHeight
                        });

                        this.currentY += track.labelHeight;
                    }
                    break;
            }
        })

        for(let z = 0; z < this.heightMap.length; z++) {
            let trackGuiDisplay = this.heightMap[z];
            if (mouseY >= trackGuiDisplay.startY && mouseY <= trackGuiDisplay.endY) {
                return this.heightMap[z];
            }
        }
    }
    /**
     * Select individual keyframe rhombus within keyframe track
     * 
     * @param {*} mouseX 
     * @param {*} mouseY 
     */
    selectKeys(mouseX, mouseY) {
        if(this.selectedKeys) {
            this.selectedKeys.forEach((key) => {
                key.selected = false
            })
        }

        this.selectedKeys = [];
        let selectedTrack = this.getTrackAt(mouseX, mouseY);
        if (!selectedTrack || selectedTrack.type !== 'keyframe') return;

        for (let i = 0; i < selectedTrack.target.keys.length; i++) {
            let key = selectedTrack.target.keys[i];
            let x = this.timeToX(key.startTime);

            if (x >= mouseX - this.trackLabelHeight * 0.3 && x <= mouseX + this.trackLabelHeight * 0.3) {
                key.selected = true;
                this.selectedKeys.push(key);
                break;
            }
        }
    }
    /**
     * 
     */
    updateGUI() {
        this.yshift = this.headerHeight;
        this.canvas.width = window.innerWidth;
        this.canvas.height = this.canvasHeight;
        var w = this.canvas.width;
        var h = this.canvas.height;

        this.tracksScrollHeight = this.canvas.height - this.headerHeight - this.timeScrollHeight;
        var totalTracksHeight = this.timeline.tracks.length * this.trackLabelHeight;
        var tracksScrollRatio = this.tracksScrollHeight / totalTracksHeight;
        this.tracksScrollThumbHeight = Math.min(Math.max(20, this.tracksScrollHeight * tracksScrollRatio), this.tracksScrollHeight);

        this.timeScrollWidth = this.canvas.width - this.trackLabelWidth - this.tracksScrollWidth;
        var animationEnd = this.timeline.findAnimationEnd();
        var visibleTime = this.xToTime(this.canvas.width - this.trackLabelWidth - this.tracksScrollWidth) - this.xToTime(0); //100 to get some space after lask key
        var timeScrollRatio = Math.max(0, Math.min(visibleTime / animationEnd, 1));
        this.timeScrollThumbWidth = timeScrollRatio * this.timeScrollWidth;
        if (this.timeScrollThumbPos + this.timeScrollThumbWidth > this.timeScrollWidth) {
            this.timeScrollThumbPos = Math.max(0, this.timeScrollWidth - this.timeScrollThumbWidth);
        }


        this.c.clearRect(0, 0, w, h);

        //buttons
        this.drawRect(0 * this.headerHeight - 4 * -1, 5, this.headerHeight - 8, this.headerHeight - 8, "#DDDDDD");
        this.drawRect(1 * this.headerHeight - 4 * 0, 5, this.headerHeight - 8, this.headerHeight - 8, "#DDDDDD");
        this.drawRect(2 * this.headerHeight - 4 * 1, 5, this.headerHeight - 8, this.headerHeight - 8, "#DDDDDD");
        this.drawRect(3 * this.headerHeight - 4 * 2, 5, this.headerHeight - 8, this.headerHeight - 8, "#DDDDDD");

        //play
        this.c.strokeStyle = "#777777";
        this.c.beginPath();
        this.c.moveTo(4 + 6.5, 5 + 5);
        this.c.lineTo(this.headerHeight - 8, this.headerHeight / 2 + 1.5);
        this.c.lineTo(4 + 6.5, this.headerHeight - 8);
        this.c.lineTo(4 + 6.5, 5 + 5);
        this.c.stroke();

        //pause
        this.c.strokeRect(this.headerHeight + 5.5, 5 + 5.5, this.headerHeight / 6, this.headerHeight - 8 - 11);
        this.c.strokeRect(this.headerHeight + 5.5 + this.headerHeight / 6 + 2, 5 + 5.5, this.headerHeight / 6, this.headerHeight - 8 - 11);

        //stop
        this.c.strokeRect(2 * this.headerHeight - 4 + 5.5, 5 + 5.5, this.headerHeight - 8 - 11, this.headerHeight - 8 - 11);

        //export
        this.c.beginPath();
        this.c.moveTo(3 * this.headerHeight - 4 * 2 + 5.5, this.headerHeight - 9.5);
        this.c.lineTo(3 * this.headerHeight - 4 * 2 + 11.5, this.headerHeight - 9.5);
        this.c.moveTo(3 * this.headerHeight - 4 * 2 + 5.5, this.headerHeight - 13.5);
        this.c.lineTo(3 * this.headerHeight - 4 * 2 + 13.5, this.headerHeight - 13.5);
        this.c.moveTo(3 * this.headerHeight - 4 * 2 + 5.5, this.headerHeight - 17.5);
        this.c.lineTo(3 * this.headerHeight - 4 * 2 + 15.5, this.headerHeight - 17.5);
        this.c.stroke();

        //tracks area clipping path
        this.c.save();
        this.c.beginPath();
        this.c.moveTo(0, this.headerHeight + 1);
        this.c.lineTo(this.canvas.width, this.headerHeight + 1);
        this.c.lineTo(this.canvas.width, this.canvas.height - this.timeScrollHeight);
        this.c.lineTo(0, this.canvas.height - this.timeScrollHeight);
        this.c.clip();
        
        this.timeline.tracks.forEach((track) => {
            this.drawTrack(track, this.yshift);
        });

        this.c.restore();

        //end of label panel
        this.drawLine(this.trackLabelWidth, 0, this.trackLabelWidth, h, "#000000");

        //timeline
        var timelineStart = 0;
        var timelineEnd = 10;
        var lastTimeLabelX = 0;

        this.c.fillStyle = "#666666";
        let x = this.timeToX(0);

        var sec = timelineStart;
        while (x < this.canvas.width) {
            x = this.timeToX(sec);
            this.drawLine(x, 0, x, this.headerHeight * 0.3, "#999999");

            var minutes = Math.floor(sec / 60);
            var seconds = sec % 60;
            var time = minutes + ":" + ((seconds < 10) ? "0" : "") + seconds;

            if (x - lastTimeLabelX > 30) {
                this.c.fillText(time, x - 6, this.headerHeight * 0.8);
                lastTimeLabelX = x;
            }
            sec += 1;
        }

        //time ticker
        this.drawLine(this.timeToX(this.timeline.time), 0, this.timeToX(this.timeline.time), h, "#FF0000");

        //time scale
        for (var j = 2; j < 20; j++) {
            var f = 1.0 - (j * j) / 361;
            this.drawLine(7 + f * (this.trackLabelWidth - 10), h - this.timeScrollHeight + 4, 7 + f * (this.trackLabelWidth - 10), h - 3, "#999999");
        }

        this.c.fillStyle = "#666666";
        this.c.beginPath();
        this.c.moveTo(7 + (1.0 - this.timeScale) * (this.trackLabelWidth - 10), h - 7);
        this.c.lineTo(11 + (1.0 - this.timeScale) * (this.trackLabelWidth - 10), h - 1);
        this.c.lineTo(3 + (1.0 - this.timeScale) * (this.trackLabelWidth - 10), h - 1);
        this.c.fill();

        //tracks scrollbar
        this.drawRect(this.canvas.width - this.tracksScrollWidth, this.headerHeight + 1, this.tracksScrollWidth, this.tracksScrollHeight, "#DDDDDD");
        if (this.tracksScrollThumbHeight < this.tracksScrollHeight) {
            this.drawRect(this.canvas.width - this.tracksScrollWidth, this.headerHeight + 1 + this.tracksScrollThumbPos, this.tracksScrollWidth, this.tracksScrollThumbHeight, "#999999");
        }

        //time scrollbar
        this.drawRect(this.trackLabelWidth, h - this.timeScrollHeight, w - this.trackLabelWidth - this.tracksScrollWidth, this.timeScrollHeight, "#DDDDDD");
        if (this.timeScrollThumbWidth < this.timeScrollWidth) {
            this.drawRect(this.trackLabelWidth + 1 + this.timeScrollThumbPos, h - this.timeScrollHeight, this.timeScrollThumbWidth, this.timeScrollHeight, "#999999");
        }

        //header borders
        this.drawLine(0, 0, w, 0, "#000000");
        this.drawLine(0, this.headerHeight, w, this.headerHeight, "#000000");
        this.drawLine(0, h - this.timeScrollHeight, this.trackLabelWidth, h - this.timeScrollHeight, "#000000");
        this.drawLine(this.trackLabelWidth, h - this.timeScrollHeight - 1, this.trackLabelWidth, h, "#000000");
    }
    /**
     * Calculate x positioning based on time
     * @param {*} time 
     */
    timeToX(time) {
        var animationEnd = this.timeline.findAnimationEnd();
        var visibleTime = this.xToTime(this.canvas.width - this.trackLabelWidth - this.tracksScrollWidth) - this.xToTime(20); //50 to get some additional space
        if (visibleTime < animationEnd) {
            time -= (animationEnd - visibleTime) * this.timeScrollX;
        }

        return this.trackLabelWidth + time * (this.timeScale * 200) + 12;
    }
    /**
     * Calculate time given x positioning
     * @param {*} x 
     */
    xToTime(x) {
        var animationEnd = this.timeline.findAnimationEnd();
        var visibleTime = (this.canvas.width - this.trackLabelWidth - this.tracksScrollWidth - 20) / (this.timeScale * 200);
        var timeShift = Math.max(0, (animationEnd - visibleTime) * this.timeScrollX);
        return (x - this.trackLabelWidth - 10) / (this.timeScale * 200) + timeShift;
    }
    /**
     * Draw the track based on its type.
     * 
     * @param {*} track 
     * @param {*} y 
     */
    drawTrack(track, y) {
        let xshift = 5;

        switch(track.type) {
            case 'keyframe':
                //object track header background
                this.drawRect(0, y + 1, this.trackLabelWidth, this.trackLabelHeight, '#FFFFFF');

                //label color
                this.c.fillStyle = '#000000';

                //bottom track line
                this.drawLine(0, y - this.trackLabelHeight, this.canvas.width, y - this.trackLabelHeight, '#FFFFFF');

                //draw track label
                this.c.fillText(track.targetName +"-"+ y, xshift, y + this.trackLabelHeight / 2 + 4);

                // Shift label position and change bg color
                xshift += 10;
                this.keysMap = {};

                this.yshift = y += this.trackLabelHeight;

                // Map modified property names to tracks.
                track.keys.forEach((key) => {
                    if (!this.keysMap[key.name]) {
                        this.keysMap[key.name] = {
                            keys: [],
                            position: 0
                        };
                    }
                    this.keysMap[key.name].keys.push(key);
                })
                
                // Iterate the keys map to draw the frames
                for (let keyframe in this.keysMap) {
                    y += this.trackLabelHeight;
                    this.keysMap[keyframe].position = y;

                    this.c.fillStyle = '#555555';
                    this.c.fillText(keyframe + "-" + y, xshift, y - this.trackLabelHeight / 4);
                    this.drawLine(0, y, this.canvas.width, y, '#FFFFFF');

                    this.keysMap[keyframe].keys.forEach((keyProperties, i) => {
                        let first = (i === 0);
                        let last = (i == this.keysMap[keyframe].keys.length - 1);

                        this.drawRombus(this.timeToX(keyProperties.startTime), this.keysMap[keyframe].position - this.trackLabelHeight * 0.5, this.trackLabelHeight * 0.5, this.trackLabelHeight * 0.5, "#999999", true, true, keyProperties.selected ? "#FF0000" : "#666666");
                        this.drawRombus(this.timeToX(keyProperties.startTime), this.keysMap[keyframe].position - this.trackLabelHeight * 0.5, this.trackLabelHeight * 0.5, this.trackLabelHeight * 0.5, "#DDDDDD", !first, !last);
                    })

                    this.yshift = this.keysMap[keyframe].position;
                }
                break;

            case 'number':
                const numberLabelHeight = 50;
                //object track header background
                this.drawRect(0, y, this.trackLabelWidth, numberLabelHeight + 1, '#FFFFFF');
                //middle track line
                this.drawLine(0, y, this.canvas.width, y, '#FFFFFF');
                //bottom
                this.drawLine(0, y + numberLabelHeight / 2 - 1, this.canvas.width, y + numberLabelHeight / 2 - 1, '#FFFFFF');
                //label color
                this.c.fillStyle = '#000000';

                //draw track label
                this.c.fillText(track.targetName, xshift, y + track.labelHeight / 2);

                this.c.strokeStyle = '#000000';
                this.c.beginPath();
                this.c.moveTo(this.timeToX(0), this.yshift);

                track.data.forEach((dataPoint, index) => {
                    this.c.lineTo(this.timeToX(0) + index * 100, this.yshift + dataPoint / 5);
                })

                this.c.stroke();
                this.yshift += numberLabelHeight;
                break;

            case 'position':
                const positionLabelHeight = 80;

                //object track header background
                this.drawRect(0, y - positionLabelHeight / 2, this.trackLabelWidth, positionLabelHeight - 1, '#FFFFFF');
                //middle track line
                this.drawLine(0, y, this.canvas.width, y, '#FFFFFF');
                //bottom
                this.drawLine(0, y + positionLabelHeight / 2 - 1, this.canvas.width, y + positionLabelHeight / 2 - 1, '#FFFFFF');
                //label color
                this.c.fillStyle = '#000000';

                //draw track name label
                this.c.fillText(track.targetName, xshift, y + 5);
                //draw track position labels.


                break;

            default:
                break;
        }
    }
    /**
     * 
     * @param {*} x1 
     * @param {*} y1 
     * @param {*} x2 
     * @param {*} y2 
     * @param {*} color 
     */
    drawLine(x1, y1, x2, y2, color) {
        this.c.strokeStyle = color;
        this.c.beginPath();
        this.c.moveTo(x1 + 0.5, y1 + 0.5);
        this.c.lineTo(x2 + 0.5, y2 + 0.5);
        this.c.stroke();
    }
    /**
     * 
     * @param {*} x 
     * @param {*} y 
     * @param {*} w 
     * @param {*} h 
     * @param {*} color 
     */
    drawRect(x, y, w, h, color) {
        this.c.fillStyle = color;
        this.c.fillRect(x, y, w, h);
    }
    /**
     * 
     * @param {*} x 
     * @param {*} y 
     * @param {*} w 
     * @param {*} h 
     * @param {*} color 
     */
    drawCenteredRect(x, y, w, h, color) {
        this.c.fillStyle = color;
        this.c.fillRect(x - w / 2, y - h / 2, w, h);
    }
    /**
     * 
     * @param {*} x 
     * @param {*} y 
     * @param {*} w 
     * @param {*} h 
     * @param {*} color 
     * @param {*} drawLeft 
     * @param {*} drawRight 
     * @param {*} strokeColor 
     */
    drawRombus(x, y, w, h, color, drawLeft, drawRight, strokeColor) {
        this.c.fillStyle = color;
        if (strokeColor) {
            this.c.lineWidth = 2;
            this.c.strokeStyle = strokeColor;
            this.c.beginPath();
            this.c.moveTo(x, y - h / 2);
            this.c.lineTo(x + w / 2, y);
            this.c.lineTo(x, y + h / 2);
            this.c.lineTo(x - w / 2, y);
            this.c.lineTo(x, y - h / 2);
            this.c.stroke();
            this.c.lineWidth = 1;
        }

        if (drawLeft) {
            this.c.beginPath();
            this.c.moveTo(x, y - h / 2);
            this.c.lineTo(x - w / 2, y);
            this.c.lineTo(x, y + h / 2);
            this.c.fill();
        }

        if (drawRight) {
            this.c.beginPath();
            this.c.moveTo(x, y - h / 2);
            this.c.lineTo(x + w / 2, y);
            this.c.lineTo(x, y + h / 2);
            this.c.fill();
        }
    }
    /**
     * 
     */
    buildInputDialog() {
        this.keyEditDialog = document.createElement("div");
        this.keyEditDialog.id = "keyEditDialog";
        this.keyEditDialog.style.cssText = "position:absolute; padding:5px; background: #DDDDDD; font-family:arial; font-size:11px; left: 100px; top:100px; border: 1px solid #AAAAAA; border-radius: 5px;";

        var easingOptions = "";

        for (var easingFunctionFamilyName in Easing) {
            var easingFunctionFamily = Easing[easingFunctionFamilyName];
            for (var easingFunctionName in easingFunctionFamily) {
                easingOptions += "<option>" + easingFunctionFamilyName + "." + easingFunctionName + "</option>";
            }
        }

        var controls = "";
        controls += '<label style="margin-right:10px">Value<input type="text" id="keyEditDialogValue"/></label>';
        controls += '<label style="margin-right:10px">Easing<select id="keyEditDialogEasing">' + easingOptions + '</label>';
        controls += '<input id="keyEditDialogOK" style="margin-left: 10px; margin-right:10px" type="button" value="OK"/>';
        controls += '<input id="keyEditDialogCancel" style="margin-right:10px" type="button" value="Cancel"/>';
        controls += '<a id="keyEditDialogDelete" style="margin-right:5px" href="#">[x]</a>';
        this.keyEditDialog.innerHTML = controls;
        document.body.appendChild(this.keyEditDialog);

        this.keyEditDialogValue = document.getElementById("keyEditDialogValue");
        this.keyEditDialogEasing = document.getElementById("keyEditDialogEasing");
        this.keyEditDialogOK = document.getElementById("keyEditDialogOK");
        this.keyEditDialogCancel = document.getElementById("keyEditDialogCancel");
        this.keyEditDialogDelete = document.getElementById("keyEditDialogDelete");

        var self = this;

        this.keyEditDialogOK.addEventListener('click', function () {
            self.applyKeyEditDialog();
            self.hideKeyEditDialog();
        }, false);

        this.keyEditDialogCancel.addEventListener('click', function () {
            self.hideKeyEditDialog();
        }, false);

        this.keyEditDialogDelete.addEventListener('click', function () {
            self.deleteSelectedKeys();
            self.rebuildSelectedTracks();
            self.hideKeyEditDialog();
        }, false);

        this.hideKeyEditDialog();
    }
    /**
     * 
     */
    applyKeyEditDialog() {
        var value = Number(this.keyEditDialogValue.value);
        if (isNaN(value)) {
            return;
        }
        var selectedOption = this.keyEditDialogEasing.options[this.keyEditDialogEasing.selectedIndex];
        // var easeType = selectedOption.value.substr(0, selectedOption.value.indexOf("."));
        // var easeBezier = selectedOption.value.substr(selectedOption.value.indexOf(".") + 1, selectedOption.value.length);
        // var easing = Easing[easeType][easeBezier];

        for (var i = 0; i < this.selectedKeys.length; i++) {
            this.selectedKeys[i].easing = selectedOption.value;
            this.selectedKeys[i].value = value;
        }
        this.rebuildSelectedTracks();
    }
    /**
     * 
     * @param {*} mouseX 
     * @param {*} mouseY 
     */
    showKeyEditDialog(mouseX, mouseY) {
        this.keyEditDialogValue.value = this.selectedKeys[0].value;
        for (var i = 0; i < this.keyEditDialogEasing.options.length; i++) {
            var option = this.keyEditDialogEasing.options[i];
            var easingFunction = Easing[option.value];
            if (easingFunction == this.selectedKeys[0].easing) {
                this.keyEditDialogEasing.selectedIndex = i;
                break;
            }
        }
        this.keyEditDialog.style.left = Math.max(50, mouseX - 200) + "px";
        this.keyEditDialog.style.top = (mouseY - 50) + "px";
        this.keyEditDialog.style.display = "block";

        this.keyEditDialogValue.focus();
    }
    /**
     * 
     */
    deleteSelectedKeys() {
        for (var i = 0; i < this.selectedKeys.length; i++) {
            var selectedKey = this.selectedKeys[i];
            var keyIndex = selectedKey.track.keys.indexOf(selectedKey);
            selectedKey.track.keys.splice(keyIndex, 1);
        }
        this.rebuildSelectedTracks();
    }
    /**
     * 
     */
    hideKeyEditDialog() {
        this.keyEditDialog.style.display = "none";
    }
    /**
     * 
     * @param {*} track 
     */
    sortTrackKeys(track) {
        track.keys.sort(function (a, b) { return a.startTime - b.startTime; });

        let result = "";
        for (let i = 0; i < track.keys.length; i++) {
            result += track.keys[i].startTime + " ";
        }
    }
    /**
     * 
     */
    rebuildSelectedTracks() {
        for (var i = 0; i < this.selectedKeys.length; i++) {
            
        }
    }
    /**
     * 
     */
    exportCode() {
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
    }
    /**
     * 
     */
    save() {
        var data = {};

        for (var i = 0; i < this.timeline.tracks.length; i++) {
            let track = this.timeline.tracks[i];
            let keysData = [];
            data[track.id] = keysData;
            if(!track.keys) continue;
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
    }
    /**
     * 
     */
    load() {
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

module.exports = TimelineGui;
