"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RTCSessionDescription = 
// @ts-ignore
window.RTCSessionDescription || window.mozRTCSessionDescription;
exports.RTCPeerConnection = 
// @ts-ignore
window.RTCPeerConnection ||
    // @ts-ignore
    window.mozRTCPeerConnection ||
    // @ts-ignore
    window.webkitRTCPeerConnection;
exports.RTCIceCandidate = 
// @ts-ignore
window.RTCIceCandidate || window.mozRTCIceCandidate;
