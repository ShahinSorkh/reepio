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
var reliable_1 = require("reliable");
var util_1 = require("./util");
var logger_1 = require("./logger");
var negotiator_1 = require("./negotiator");
var enums_1 = require("./enums");
var baseconnection_1 = require("./baseconnection");
/**
 * Wraps a DataChannel between two Peers.
 */
var DataConnection = /** @class */ (function (_super) {
    __extends(DataConnection, _super);
    function DataConnection(peerId, provider, options) {
        var _this = _super.call(this, peerId, provider, options) || this;
        _this._buffer = [];
        _this._bufferSize = 0;
        _this._buffering = false;
        _this._chunkedData = {};
        _this.connectionId =
            _this.options.connectionId || DataConnection.ID_PREFIX + util_1.util.randomToken();
        _this.label = _this.options.label || _this.connectionId;
        _this.serialization = _this.options.serialization || enums_1.SerializationType.Binary;
        _this.reliable = _this.options.reliable;
        if (_this.options._payload) {
            _this._peerBrowser = _this.options._payload.browser;
        }
        _this._negotiator = new negotiator_1.Negotiator(_this);
        _this._negotiator.startConnection(_this.options._payload || {
            originator: true
        });
        return _this;
    }
    Object.defineProperty(DataConnection.prototype, "type", {
        get: function () {
            return enums_1.ConnectionType.Data;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DataConnection.prototype, "dataChannel", {
        get: function () {
            return this._dc;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DataConnection.prototype, "bufferSize", {
        get: function () { return this._bufferSize; },
        enumerable: true,
        configurable: true
    });
    /** Called by the Negotiator when the DataChannel is ready. */
    DataConnection.prototype.initialize = function (dc) {
        this._dc = dc;
        this._configureDataChannel();
    };
    DataConnection.prototype._configureDataChannel = function () {
        var _this = this;
        if (util_1.util.supports.sctp) {
            this.dataChannel.binaryType = "arraybuffer";
        }
        this.dataChannel.onopen = function () {
            logger_1.default.log("Data channel connection success");
            _this._open = true;
            _this.emit(enums_1.ConnectionEventType.Open);
        };
        // Use the Reliable shim for non Firefox browsers
        if (!util_1.util.supports.sctp && this.reliable) {
            var isLoggingEnable = logger_1.default.logLevel > logger_1.LogLevel.Disabled;
            this._reliable = new reliable_1.Reliable(this.dataChannel, isLoggingEnable);
        }
        if (this._reliable) {
            this._reliable.onmessage = function (msg) {
                _this.emit(enums_1.ConnectionEventType.Data, msg);
            };
        }
        else {
            this.dataChannel.onmessage = function (e) {
                _this._handleDataMessage(e);
            };
        }
        this.dataChannel.onclose = function () {
            logger_1.default.log("DataChannel closed for:", _this.peer);
            _this.close();
        };
    };
    // Handles a DataChannel message.
    DataConnection.prototype._handleDataMessage = function (e) {
        var _this = this;
        var data = e.data;
        var datatype = data.constructor;
        var isBinarySerialization = this.serialization === enums_1.SerializationType.Binary ||
            this.serialization === enums_1.SerializationType.BinaryUTF8;
        if (isBinarySerialization) {
            if (datatype === Blob) {
                // Datatype should never be blob
                util_1.util.blobToArrayBuffer(data, function (ab) {
                    data = util_1.util.unpack(ab);
                    _this.emit(enums_1.ConnectionEventType.Data, data);
                });
                return;
            }
            else if (datatype === ArrayBuffer) {
                data = util_1.util.unpack(data);
            }
            else if (datatype === String) {
                // String fallback for binary data for browsers that don't support binary yet
                var ab = util_1.util.binaryStringToArrayBuffer(data);
                data = util_1.util.unpack(ab);
            }
        }
        else if (this.serialization === enums_1.SerializationType.JSON) {
            data = JSON.parse(data);
        }
        // Check if we've chunked--if so, piece things back together.
        // We're guaranteed that this isn't 0.
        if (data.__peerData) {
            var id = data.__peerData;
            var chunkInfo = this._chunkedData[id] || {
                data: [],
                count: 0,
                total: data.total
            };
            chunkInfo.data[data.n] = data.data;
            chunkInfo.count++;
            if (chunkInfo.total === chunkInfo.count) {
                // Clean up before making the recursive call to `_handleDataMessage`.
                delete this._chunkedData[id];
                // We've received all the chunks--time to construct the complete data.
                data = new Blob(chunkInfo.data);
                this._handleDataMessage({ data: data });
            }
            this._chunkedData[id] = chunkInfo;
            return;
        }
        _super.prototype.emit.call(this, enums_1.ConnectionEventType.Data, data);
    };
    /**
     * Exposed functionality for users.
     */
    /** Allows user to close connection. */
    DataConnection.prototype.close = function () {
        this._buffer = [];
        this._bufferSize = 0;
        if (this._negotiator) {
            this._negotiator.cleanup();
            this._negotiator = null;
        }
        if (this.provider) {
            this.provider._removeConnection(this);
            this.provider = null;
        }
        if (!this.open) {
            return;
        }
        this._open = false;
        _super.prototype.emit.call(this, enums_1.ConnectionEventType.Close);
    };
    /** Allows user to send data. */
    DataConnection.prototype.send = function (data, chunked) {
        var _this = this;
        if (!this.open) {
            _super.prototype.emit.call(this, enums_1.ConnectionEventType.Error, new Error("Connection is not open. You should listen for the `open` event before sending messages."));
            return;
        }
        if (this._reliable) {
            // Note: reliable shim sending will make it so that you cannot customize
            // serialization.
            this._reliable.send(data);
            return;
        }
        if (this.serialization === enums_1.SerializationType.JSON) {
            this._bufferedSend(JSON.stringify(data));
        }
        else if (this.serialization === enums_1.SerializationType.Binary ||
            this.serialization === enums_1.SerializationType.BinaryUTF8) {
            var blob = util_1.util.pack(data);
            // For Chrome-Firefox interoperability, we need to make Firefox "chunk"
            // the data it sends out.
            var needsChunking = util_1.util.chunkedBrowsers[this._peerBrowser] ||
                util_1.util.chunkedBrowsers[util_1.util.browser];
            if (needsChunking && !chunked && blob.size > util_1.util.chunkedMTU) {
                this._sendChunks(blob);
                return;
            }
            // DataChannel currently only supports strings.
            if (!util_1.util.supports.sctp) {
                util_1.util.blobToBinaryString(blob, function (str) {
                    _this._bufferedSend(str);
                });
            }
            else if (!util_1.util.supports.binaryBlob) {
                // We only do this if we really need to (e.g. blobs are not supported),
                // because this conversion is costly.
                util_1.util.blobToArrayBuffer(blob, function (ab) {
                    _this._bufferedSend(ab);
                });
            }
            else {
                this._bufferedSend(blob);
            }
        }
        else {
            this._bufferedSend(data);
        }
    };
    DataConnection.prototype._bufferedSend = function (msg) {
        if (this._buffering || !this._trySend(msg)) {
            this._buffer.push(msg);
            this._bufferSize = this._buffer.length;
        }
    };
    // Returns true if the send succeeds.
    DataConnection.prototype._trySend = function (msg) {
        var _this = this;
        if (!this.open) {
            return false;
        }
        try {
            this.dataChannel.send(msg);
        }
        catch (e) {
            this._buffering = true;
            setTimeout(function () {
                // Try again.
                _this._buffering = false;
                _this._tryBuffer();
            }, 100);
            return false;
        }
        return true;
    };
    // Try to send the first message in the buffer.
    DataConnection.prototype._tryBuffer = function () {
        if (!this.open) {
            return;
        }
        if (this._buffer.length === 0) {
            return;
        }
        var msg = this._buffer[0];
        if (this._trySend(msg)) {
            this._buffer.shift();
            this._bufferSize = this._buffer.length;
            this._tryBuffer();
        }
    };
    DataConnection.prototype._sendChunks = function (blob) {
        var e_1, _a;
        var blobs = util_1.util.chunk(blob);
        try {
            for (var blobs_1 = __values(blobs), blobs_1_1 = blobs_1.next(); !blobs_1_1.done; blobs_1_1 = blobs_1.next()) {
                var blob_1 = blobs_1_1.value;
                this.send(blob_1, true);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (blobs_1_1 && !blobs_1_1.done && (_a = blobs_1.return)) _a.call(blobs_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    DataConnection.prototype.handleMessage = function (message) {
        var payload = message.payload;
        switch (message.type) {
            case enums_1.ServerMessageType.Answer:
                this._peerBrowser = payload.browser;
                // Forward to negotiator
                this._negotiator.handleSDP(message.type, payload.sdp);
                break;
            case enums_1.ServerMessageType.Candidate:
                this._negotiator.handleCandidate(payload.candidate);
                break;
            default:
                logger_1.default.warn("Unrecognized message type:", message.type, "from peer:", this.peer);
                break;
        }
    };
    DataConnection.ID_PREFIX = "dc_";
    return DataConnection;
}(baseconnection_1.BaseConnection));
exports.DataConnection = DataConnection;
