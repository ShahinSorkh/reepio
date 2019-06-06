"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Reliable = require("reliable");
var util_1 = require("./util");
var logger_1 = require("./logger");
var adapter_1 = require("./adapter");
var enums_1 = require("./enums");
/**
 * Manages all negotiations between Peers.
 */
var Negotiator = /** @class */ (function () {
    function Negotiator(connection) {
        this.connection = connection;
    }
    /** Returns a PeerConnection object set up correctly (for data, media). */
    Negotiator.prototype.startConnection = function (options) {
        var peerConnection = this._startPeerConnection();
        // Set the connection's PC.
        this.connection.peerConnection = peerConnection;
        if (this.connection.type === enums_1.ConnectionType.Media && options._stream) {
            this._addTracksToConnection(options._stream, peerConnection);
        }
        // What do we need to do now?
        if (options.originator) {
            if (this.connection.type === enums_1.ConnectionType.Data) {
                var dataConnection = this.connection;
                var config = {};
                if (!util_1.util.supports.sctp) {
                    config = { reliable: options.reliable };
                }
                var dataChannel = peerConnection.createDataChannel(dataConnection.label, config);
                dataConnection.initialize(dataChannel);
            }
            this._makeOffer();
        }
        else {
            this.handleSDP("OFFER", options.sdp);
        }
    };
    /** Start a PC. */
    Negotiator.prototype._startPeerConnection = function () {
        logger_1.default.log("Creating RTCPeerConnection.");
        var optional = {};
        if (this.connection.type === enums_1.ConnectionType.Data && !util_1.util.supports.sctp) {
            optional = { optional: [{ RtpDataChannels: true }] };
        }
        else if (this.connection.type === enums_1.ConnectionType.Media) {
            // Interop req for chrome.
            optional = { optional: [{ DtlsSrtpKeyAgreement: true }] };
        }
        var peerConnection = new adapter_1.RTCPeerConnection(this.connection.provider.options.config, optional);
        this._setupListeners(peerConnection);
        return peerConnection;
    };
    /** Set up various WebRTC listeners. */
    Negotiator.prototype._setupListeners = function (peerConnection) {
        var _this = this;
        var peerId = this.connection.peer;
        var connectionId = this.connection.connectionId;
        var connectionType = this.connection.type;
        var provider = this.connection.provider;
        // ICE CANDIDATES.
        logger_1.default.log("Listening for ICE candidates.");
        peerConnection.onicecandidate = function (evt) {
            if (evt.candidate) {
                logger_1.default.log("Received ICE candidates for:", peerId);
                provider.socket.send({
                    type: enums_1.ServerMessageType.Candidate,
                    payload: {
                        candidate: evt.candidate,
                        type: connectionType,
                        connectionId: connectionId
                    },
                    dst: peerId
                });
            }
        };
        peerConnection.oniceconnectionstatechange = function () {
            switch (peerConnection.iceConnectionState) {
                case "failed":
                    logger_1.default.log("iceConnectionState is failed, closing connections to " +
                        peerId);
                    _this.connection.emit(enums_1.ConnectionEventType.Error, new Error("Negotiation of connection to " + peerId + " failed."));
                    _this.connection.close();
                    break;
                case "closed":
                    logger_1.default.log("iceConnectionState is closed, closing connections to " +
                        peerId);
                    _this.connection.emit(enums_1.ConnectionEventType.Error, new Error("Negotiation of connection to " + peerId + " failed."));
                    _this.connection.close();
                    break;
                case "disconnected":
                    logger_1.default.log("iceConnectionState is disconnected, closing connections to " +
                        peerId);
                    break;
                case "completed":
                    peerConnection.onicecandidate = util_1.util.noop;
                    break;
            }
            _this.connection.emit(enums_1.ConnectionEventType.IceStateChanged, peerConnection.iceConnectionState);
        };
        // DATACONNECTION.
        logger_1.default.log("Listening for data channel");
        // Fired between offer and answer, so options should already be saved
        // in the options hash.
        peerConnection.ondatachannel = function (evt) {
            logger_1.default.log("Received data channel");
            var dataChannel = evt.channel;
            var connection = (provider.getConnection(peerId, connectionId));
            connection.initialize(dataChannel);
        };
        // MEDIACONNECTION.
        logger_1.default.log("Listening for remote stream");
        peerConnection.ontrack = function (evt) {
            logger_1.default.log("Received remote stream");
            var stream = evt.streams[0];
            var connection = provider.getConnection(peerId, connectionId);
            if (connection.type === enums_1.ConnectionType.Media) {
                var mediaConnection = connection;
                _this._addStreamToMediaConnection(stream, mediaConnection);
            }
        };
    };
    Negotiator.prototype.cleanup = function () {
        logger_1.default.log("Cleaning up PeerConnection to " + this.connection.peer);
        var peerConnection = this.connection.peerConnection;
        if (!peerConnection) {
            return;
        }
        this.connection.peerConnection = null;
        //unsubscribe from all PeerConnection's events
        peerConnection.onicecandidate = peerConnection.oniceconnectionstatechange = peerConnection.ondatachannel = peerConnection.ontrack = function () { };
        var peerConnectionNotClosed = peerConnection.signalingState !== "closed";
        var dataChannelNotClosed = false;
        if (this.connection.type === enums_1.ConnectionType.Data) {
            var dataConnection = this.connection;
            var dataChannel = dataConnection.dataChannel;
            dataChannelNotClosed =
                dataChannel.readyState && dataChannel.readyState !== "closed";
        }
        if (peerConnectionNotClosed || dataChannelNotClosed) {
            peerConnection.close();
        }
    };
    Negotiator.prototype._makeOffer = function () {
        return __awaiter(this, void 0, void 0, function () {
            var peerConnection, provider, offer, dataConnection, payload, dataConnection, err_2, err_1_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        peerConnection = this.connection.peerConnection;
                        provider = this.connection.provider;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, peerConnection.createOffer(this.connection.options.constraints)];
                    case 2:
                        offer = _a.sent();
                        logger_1.default.log("Created offer.");
                        if (!util_1.util.supports.sctp && this.connection.type === enums_1.ConnectionType.Data) {
                            dataConnection = this.connection;
                            if (dataConnection.reliable) {
                                offer.sdp = Reliable.higherBandwidthSDP(offer.sdp);
                            }
                        }
                        if (this.connection.options.sdpTransform && typeof this.connection.options.sdpTransform === 'function') {
                            offer.sdp = this.connection.options.sdpTransform(offer.sdp) || offer.sdp;
                        }
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, peerConnection.setLocalDescription(offer)];
                    case 4:
                        _a.sent();
                        logger_1.default.log("Set localDescription:", offer, "for:" + this.connection.peer);
                        payload = {
                            sdp: offer,
                            type: this.connection.type,
                            connectionId: this.connection.connectionId,
                            metadata: this.connection.metadata,
                            browser: util_1.util.browser
                        };
                        if (this.connection.type === enums_1.ConnectionType.Data) {
                            dataConnection = this.connection;
                            payload = __assign({}, payload, { label: dataConnection.label, reliable: dataConnection.reliable, serialization: dataConnection.serialization });
                        }
                        provider.socket.send({
                            type: enums_1.ServerMessageType.Offer,
                            payload: payload,
                            dst: this.connection.peer
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        err_2 = _a.sent();
                        // TODO: investigate why _makeOffer is being called from the answer
                        if (err_2 !=
                            "OperationError: Failed to set local offer sdp: Called in wrong state: kHaveRemoteOffer") {
                            provider.emitError(enums_1.PeerErrorType.WebRTC, err_2);
                            logger_1.default.log("Failed to setLocalDescription, ", err_2);
                        }
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        err_1_1 = _a.sent();
                        provider.emitError(enums_1.PeerErrorType.WebRTC, err_1_1);
                        logger_1.default.log("Failed to createOffer, ", err_1_1);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    Negotiator.prototype._makeAnswer = function () {
        return __awaiter(this, void 0, void 0, function () {
            var peerConnection, provider, answer, dataConnection, err_3, err_1_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        peerConnection = this.connection.peerConnection;
                        provider = this.connection.provider;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, peerConnection.createAnswer()];
                    case 2:
                        answer = _a.sent();
                        logger_1.default.log("Created answer.");
                        if (!util_1.util.supports.sctp && this.connection.type === enums_1.ConnectionType.Data) {
                            dataConnection = this.connection;
                            if (dataConnection.reliable) {
                                answer.sdp = Reliable.higherBandwidthSDP(answer.sdp);
                            }
                        }
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, peerConnection.setLocalDescription(answer)];
                    case 4:
                        _a.sent();
                        logger_1.default.log("Set localDescription:", answer, "for:" + this.connection.peer);
                        provider.socket.send({
                            type: enums_1.ServerMessageType.Answer,
                            payload: {
                                sdp: answer,
                                type: this.connection.type,
                                connectionId: this.connection.connectionId,
                                browser: util_1.util.browser
                            },
                            dst: this.connection.peer
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        err_3 = _a.sent();
                        provider.emitError(enums_1.PeerErrorType.WebRTC, err_3);
                        logger_1.default.log("Failed to setLocalDescription, ", err_3);
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        err_1_2 = _a.sent();
                        provider.emitError(enums_1.PeerErrorType.WebRTC, err_1_2);
                        logger_1.default.log("Failed to create answer, ", err_1_2);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /** Handle an SDP. */
    Negotiator.prototype.handleSDP = function (type, sdp) {
        return __awaiter(this, void 0, void 0, function () {
            var peerConnection, provider, self, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sdp = new adapter_1.RTCSessionDescription(sdp);
                        peerConnection = this.connection.peerConnection;
                        provider = this.connection.provider;
                        logger_1.default.log("Setting remote description", sdp);
                        self = this;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, peerConnection.setRemoteDescription(sdp)];
                    case 2:
                        _a.sent();
                        logger_1.default.log("Set remoteDescription:" + type + " for:" + this.connection.peer);
                        if (!(type === "OFFER")) return [3 /*break*/, 4];
                        return [4 /*yield*/, self._makeAnswer()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        err_4 = _a.sent();
                        provider.emitError(enums_1.PeerErrorType.WebRTC, err_4);
                        logger_1.default.log("Failed to setRemoteDescription, ", err_4);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /** Handle a candidate. */
    Negotiator.prototype.handleCandidate = function (ice) {
        return __awaiter(this, void 0, void 0, function () {
            var candidate, sdpMLineIndex, peerConnection, provider, err_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        candidate = ice.candidate;
                        sdpMLineIndex = ice.sdpMLineIndex;
                        peerConnection = this.connection.peerConnection;
                        provider = this.connection.provider;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, peerConnection.addIceCandidate(new adapter_1.RTCIceCandidate({
                                sdpMLineIndex: sdpMLineIndex,
                                candidate: candidate
                            }))];
                    case 2:
                        _a.sent();
                        logger_1.default.log("Added ICE candidate for:" + this.connection.peer);
                        return [3 /*break*/, 4];
                    case 3:
                        err_5 = _a.sent();
                        provider.emitError(enums_1.PeerErrorType.WebRTC, err_5);
                        logger_1.default.log("Failed to handleCandidate, ", err_5);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Negotiator.prototype._addTracksToConnection = function (stream, peerConnection) {
        logger_1.default.log("add tracks from stream " + stream.id + " to peer connection");
        if (!peerConnection.addTrack) {
            return logger_1.default.error("Your browser does't support RTCPeerConnection#addTrack. Ignored.");
        }
        stream.getTracks().forEach(function (track) {
            peerConnection.addTrack(track, stream);
        });
    };
    Negotiator.prototype._addStreamToMediaConnection = function (stream, mediaConnection) {
        logger_1.default.log("add stream " + stream.id + " to media connection " + mediaConnection.connectionId);
        mediaConnection.addStream(stream);
    };
    return Negotiator;
}());
exports.Negotiator = Negotiator;
