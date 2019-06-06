"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var logger_1 = require("./logger");
var negotiator_1 = require("./negotiator");
var enums_1 = require("./enums");
var baseconnection_1 = require("./baseconnection");
/**
 * Wraps the streaming interface between two Peers.
 */
var MediaConnection = /** @class */ (function (_super) {
    __extends(MediaConnection, _super);
    function MediaConnection(peerId, provider, options) {
        var _this = _super.call(this, peerId, provider, options) || this;
        _this._localStream = _this.options._stream;
        _this.connectionId =
            _this.options.connectionId ||
                MediaConnection.ID_PREFIX + util_1.util.randomToken();
        _this._negotiator = new negotiator_1.Negotiator(_this);
        if (_this._localStream) {
            _this._negotiator.startConnection({
                _stream: _this._localStream,
                originator: true
            });
        }
        return _this;
    }
    Object.defineProperty(MediaConnection.prototype, "type", {
        get: function () {
            return enums_1.ConnectionType.Media;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MediaConnection.prototype, "localStream", {
        get: function () { return this._localStream; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MediaConnection.prototype, "remoteStream", {
        get: function () { return this._remoteStream; },
        enumerable: true,
        configurable: true
    });
    MediaConnection.prototype.addStream = function (remoteStream) {
        logger_1.default.log("Receiving stream", remoteStream);
        this._remoteStream = remoteStream;
        _super.prototype.emit.call(this, enums_1.ConnectionEventType.Stream, remoteStream); // Should we call this `open`?
    };
    MediaConnection.prototype.handleMessage = function (message) {
        var type = message.type;
        var payload = message.payload;
        switch (message.type) {
            case enums_1.ServerMessageType.Answer:
                // Forward to negotiator
                this._negotiator.handleSDP(type, payload.sdp);
                this._open = true;
                break;
            case enums_1.ServerMessageType.Candidate:
                this._negotiator.handleCandidate(payload.candidate);
                break;
            default:
                logger_1.default.warn("Unrecognized message type:" + type + " from peer:" + this.peer);
                break;
        }
    };
    MediaConnection.prototype.answer = function (stream) {
        var e_1, _a;
        if (this._localStream) {
            logger_1.default.warn("Local stream already exists on this MediaConnection. Are you answering a call twice?");
            return;
        }
        this._localStream = stream;
        this._negotiator.startConnection(__assign({}, this.options._payload, { _stream: stream }));
        // Retrieve lost messages stored because PeerConnection not set up.
        var messages = this.provider._getMessages(this.connectionId);
        try {
            for (var messages_1 = __values(messages), messages_1_1 = messages_1.next(); !messages_1_1.done; messages_1_1 = messages_1.next()) {
                var message = messages_1_1.value;
                this.handleMessage(message);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (messages_1_1 && !messages_1_1.done && (_a = messages_1.return)) _a.call(messages_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this._open = true;
    };
    /**
     * Exposed functionality for users.
     */
    /** Allows user to close connection. */
    MediaConnection.prototype.close = function () {
        if (this._negotiator) {
            this._negotiator.cleanup();
            this._negotiator = null;
        }
        this._localStream = null;
        this._remoteStream = null;
        if (this.provider) {
            this.provider._removeConnection(this);
            this.provider = null;
        }
        if (this.options && this.options._stream) {
            this.options._stream = null;
        }
        if (!this.open) {
            return;
        }
        this._open = false;
        _super.prototype.emit.call(this, enums_1.ConnectionEventType.Close);
    };
    MediaConnection.ID_PREFIX = "mc_";
    return MediaConnection;
}(baseconnection_1.BaseConnection));
exports.MediaConnection = MediaConnection;
