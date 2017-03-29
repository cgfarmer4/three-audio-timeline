'use_strict';

const Easing = { 
    Linear: {
        EaseNone: function(k) {
            return k;
        }
    },
    Quadratic: {
        EaseIn: function (k) {
            return k * k;
        },
        EaseOut: function (k) {
            return - k * (k - 2);
        },
        EaseInOut: function (k) {
            if ((k *= 2) < 1) return 0.5 * k * k;
            return - 0.5 * (--k * (k - 2) - 1);
        }
    },
    Cubic: {
        EaseIn: function (k) {
            return k * k * k;
        },
        EaseOut: function (k) {
            return --k * k * k + 1;
        },
        // EaseInOut = function (k) {
        //     if ((k *= 2) < 1) return 0.5 * k * k * k;
        //     return 0.5 * ((k -= 2) * k * k + 2);
        // }
    },
    Quartic: {},
    Quintic: {},
    Sinusoidal: {},
    Exponential: {},
    Circular: {},
    Elastic: {
        EaseIn: function (k) {
            var s, a = 0.1, p = 0.4;
            if (k === 0) return 0; if (k == 1) return 1; if (!p) p = 0.3;
            if (!a || a < 1) { a = 1; s = p / 4; }
            else s = p / (2 * Math.PI) * Math.asin(1 / a);
            return - (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
        },
        EaseOut: function (k) {
            var s, a = 0.1, p = 0.4;
            if (k === 0) return 0; if (k == 1) return 1; if (!p) p = 0.3;
            if (!a || a < 1) { a = 1; s = p / 4; }
            else s = p / (2 * Math.PI) * Math.asin(1 / a);
            return (a * Math.pow(2, - 10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
        },
        EaseInOut: function (k) {
            var s, a = 0.1, p = 0.4;
            if (k === 0) return 0; if (k == 1) return 1; if (!p) p = 0.3;
            if (!a || a < 1) { a = 1; s = p / 4; }
            else s = p / (2 * Math.PI) * Math.asin(1 / a);
            if ((k *= 2) < 1) return - 0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
            return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;
        }
    },
    Back: {
        EaseIn: function (k) {
            var s = 1.70158;
            return k * k * ((s + 1) * k - s);
        },
        EaseOut: function (k) {
            var s = 1.70158;
            return (k = k - 1) * k * ((s + 1) * k + s) + 1;
        },
        EaseInOut: function (k) {
            var s = 1.70158 * 1.525;
            if ((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
            return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
        }
    }, 
    Bounce: {
        EaseIn: function (k) {
            return 1 - Easing.Bounce.EaseOut(1 - k);
        },
        EaseOut: function (k) {
            if ((k /= 1) < (1 / 2.75)) {
                return 7.5625 * k * k;
            } else if (k < (2 / 2.75)) {
                return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
            } else if (k < (2.5 / 2.75)) {
                return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
            } else {
                return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
            }
        },
        EaseInOut: function (k) {
            if (k < 0.5) return Easing.Bounce.EaseIn(k * 2) * 0.5;
            return Easing.Bounce.EaseOut(k * 2 - 1) * 0.5 + 0.5;
        }
    } 
};

module.exports = Easing;

// Timeline.stringToEasingFunction = function (name) {
//     return Timeline.easingMap[name];
// };

// Timeline.easingMap = {
// };

// for (var easingFunctionFamilyName in Timeline.Easing) {
//     var easingFunctionFamily = Timeline.Easing[easingFunctionFamilyName];
//     for (var easingFunctionName in easingFunctionFamily) {
//         Timeline.easingMap[easingFunctionFamilyName + "." + easingFunctionName] = easingFunctionFamily[easingFunctionName];
//     }
// }
