"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ConnectionEventType;
(function (ConnectionEventType) {
    ConnectionEventType["Open"] = "open";
    ConnectionEventType["Stream"] = "stream";
    ConnectionEventType["Data"] = "data";
    ConnectionEventType["Close"] = "close";
    ConnectionEventType["Error"] = "error";
    ConnectionEventType["IceStateChanged"] = "iceStateChanged";
})(ConnectionEventType = exports.ConnectionEventType || (exports.ConnectionEventType = {}));
var ConnectionType;
(function (ConnectionType) {
    ConnectionType["Data"] = "data";
    ConnectionType["Media"] = "media";
})(ConnectionType = exports.ConnectionType || (exports.ConnectionType = {}));
var PeerEventType;
(function (PeerEventType) {
    PeerEventType["Open"] = "open";
    PeerEventType["Close"] = "close";
    PeerEventType["Connection"] = "connection";
    PeerEventType["Call"] = "call";
    PeerEventType["Disconnected"] = "disconnected";
    PeerEventType["Error"] = "error";
})(PeerEventType = exports.PeerEventType || (exports.PeerEventType = {}));
var PeerErrorType;
(function (PeerErrorType) {
    PeerErrorType["BrowserIncompatible"] = "browser-incompatible";
    PeerErrorType["Disconnected"] = "disconnected";
    PeerErrorType["InvalidID"] = "invalid-id";
    PeerErrorType["InvalidKey"] = "invalid-key";
    PeerErrorType["Network"] = "network";
    PeerErrorType["PeerUnavailable"] = "peer-unavailable";
    PeerErrorType["SslUnavailable"] = "ssl-unavailable";
    PeerErrorType["ServerError"] = "server-error";
    PeerErrorType["SocketError"] = "socket-error";
    PeerErrorType["SocketClosed"] = "socket-closed";
    PeerErrorType["UnavailableID"] = "unavailable-id";
    PeerErrorType["WebRTC"] = "webrtc";
})(PeerErrorType = exports.PeerErrorType || (exports.PeerErrorType = {}));
var SerializationType;
(function (SerializationType) {
    SerializationType["Binary"] = "binary";
    SerializationType["BinaryUTF8"] = "binary-utf8";
    SerializationType["JSON"] = "json";
})(SerializationType = exports.SerializationType || (exports.SerializationType = {}));
var SocketEventType;
(function (SocketEventType) {
    SocketEventType["Message"] = "message";
    SocketEventType["Disconnected"] = "disconnected";
    SocketEventType["Error"] = "error";
    SocketEventType["Close"] = "close";
})(SocketEventType = exports.SocketEventType || (exports.SocketEventType = {}));
var ServerMessageType;
(function (ServerMessageType) {
    ServerMessageType["Heartbeat"] = "HEARTBEAT";
    ServerMessageType["Candidate"] = "CANDIDATE";
    ServerMessageType["Offer"] = "OFFER";
    ServerMessageType["Answer"] = "ANSWER";
    ServerMessageType["Open"] = "OPEN";
    ServerMessageType["Error"] = "ERROR";
    ServerMessageType["IdTaken"] = "ID-TAKEN";
    ServerMessageType["InvalidKey"] = "INVALID-KEY";
    ServerMessageType["Leave"] = "LEAVE";
    ServerMessageType["Expire"] = "EXPIRE"; // The offer sent to a peer has expired without response.
})(ServerMessageType = exports.ServerMessageType || (exports.ServerMessageType = {}));
