"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BinaryPack = require("js-binarypack");
var adapter_1 = require("./adapter");
var DEFAULT_CONFIG = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    sdpSemantics: "unified-plan"
};
var util = /** @class */ (function () {
    function util() {
    }
    util.noop = function () { };
    // Ensure alphanumeric ids
    util.validateId = function (id) {
        // Allow empty ids
        return !id || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(id);
    };
    // chunks a blob.
    util.chunk = function (bl) {
        var chunks = [];
        var size = bl.size;
        var total = Math.ceil(size / util.chunkedMTU);
        var index;
        var start = (index = 0);
        while (start < size) {
            var end = Math.min(size, start + util.chunkedMTU);
            var b = bl.slice(start, end);
            var chunk = {
                __peerData: this._dataCount,
                n: index,
                data: b,
                total: total
            };
            chunks.push(chunk);
            start = end;
            index++;
        }
        this._dataCount++;
        return chunks;
    };
    util.blobToArrayBuffer = function (blob, cb) {
        var fr = new FileReader();
        fr.onload = function (evt) {
            // @ts-ignore
            cb(evt.target.result);
        };
        fr.readAsArrayBuffer(blob);
    };
    util.blobToBinaryString = function (blob, cb) {
        var fr = new FileReader();
        fr.onload = function (evt) {
            // @ts-ignore
            cb(evt.target.result);
        };
        fr.readAsBinaryString(blob);
    };
    util.binaryStringToArrayBuffer = function (binary) {
        var byteArray = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) {
            byteArray[i] = binary.charCodeAt(i) & 0xff;
        }
        return byteArray.buffer;
    };
    util.randomToken = function () {
        return Math.random()
            .toString(36)
            .substr(2);
    };
    util.isSecure = function () {
        return location.protocol === "https:";
    };
    util.CLOUD_HOST = "0.peerjs.com";
    util.CLOUD_PORT = 443;
    // Browsers that need chunking:
    util.chunkedBrowsers = { Chrome: 1 };
    util.chunkedMTU = 16300; // The original 60000 bytes setting does not work when sending data from Firefox to Chrome, which is "cut off" after 16384 bytes and delivered individually.
    // Returns browser-agnostic default config
    util.defaultConfig = DEFAULT_CONFIG;
    // Returns the current browser.
    util.browser = (function (global) {
        // @ts-ignore
        if (global.mozRTCPeerConnection) {
            return "Firefox";
        }
        // @ts-ignore
        if (global.webkitRTCPeerConnection) {
            return "Chrome";
        }
        if (global.RTCPeerConnection) {
            return "Supported";
        }
        return "Unsupported";
    })(window);
    // Lists which features are supported
    util.supports = (function () {
        if (typeof adapter_1.RTCPeerConnection === "undefined") {
            return {};
        }
        var data = true;
        var audioVideo = true;
        var binaryBlob = false;
        var sctp = false;
        // @ts-ignore
        var onnegotiationneeded = !!window.webkitRTCPeerConnection;
        var pc, dc;
        try {
            pc = new adapter_1.RTCPeerConnection(DEFAULT_CONFIG, {
                optional: [{ RtpDataChannels: true }]
            });
        }
        catch (e) {
            data = false;
            audioVideo = false;
        }
        if (data) {
            try {
                dc = pc.createDataChannel("_PEERJSTEST");
            }
            catch (e) {
                data = false;
            }
        }
        if (data) {
            // Binary test
            try {
                dc.binaryType = "blob";
                binaryBlob = true;
            }
            catch (e) { }
            // Reliable test.
            // Unfortunately Chrome is a bit unreliable about whether or not they
            // support reliable.
            var reliablePC = new adapter_1.RTCPeerConnection(DEFAULT_CONFIG, {});
            try {
                var reliableDC = reliablePC.createDataChannel("_PEERJSRELIABLETEST", {});
                sctp = reliableDC.ordered;
            }
            catch (e) { }
            reliablePC.close();
        }
        // FIXME: not really the best check...
        if (audioVideo) {
            audioVideo = !!pc.addStream;
        }
        if (pc) {
            pc.close();
        }
        return {
            audioVideo: audioVideo,
            data: data,
            binaryBlob: binaryBlob,
            binary: sctp,
            reliable: sctp,
            sctp: sctp,
            onnegotiationneeded: onnegotiationneeded
        };
    })();
    util.pack = BinaryPack.pack;
    util.unpack = BinaryPack.unpack;
    // Binary stuff
    util._dataCount = 1;
    return util;
}());
exports.util = util;
