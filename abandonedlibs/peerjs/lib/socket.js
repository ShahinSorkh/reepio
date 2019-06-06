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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
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
var eventemitter3_1 = require("eventemitter3");
var logger_1 = require("./logger");
var enums_1 = require("./enums");
/**
 * An abstraction on top of WebSockets to provide fastest
 * possible connection for peers.
 */
var Socket = /** @class */ (function (_super) {
    __extends(Socket, _super);
    function Socket(secure, host, port, path, key) {
        var _this = _super.call(this) || this;
        _this.WEB_SOCKET_PING_INTERVAL = 20000; //ms
        _this._disconnected = false;
        _this._messagesQueue = [];
        var wsProtocol = secure ? "wss://" : "ws://";
        _this._wsUrl = wsProtocol + host + ":" + port + path + "peerjs?key=" + key;
        return _this;
    }
    /** Check in with ID or get one from server. */
    Socket.prototype.start = function (id, token) {
        this._id = id;
        this._wsUrl += "&id=" + id + "&token=" + token;
        this._startWebSocket();
    };
    /** Start up websocket communications. */
    Socket.prototype._startWebSocket = function () {
        var _this = this;
        if (this._socket) {
            return;
        }
        this._socket = new WebSocket(this._wsUrl);
        this._socket.onmessage = function (event) {
            var data;
            try {
                data = JSON.parse(event.data);
            }
            catch (e) {
                logger_1.default.log("Invalid server message", event.data);
                return;
            }
            _this.emit(enums_1.SocketEventType.Message, data);
        };
        this._socket.onclose = function (event) {
            logger_1.default.log("Socket closed.", event);
            ;
            _this._disconnected = true;
            clearTimeout(_this._wsPingTimer);
            _this.emit(enums_1.SocketEventType.Disconnected);
        };
        // Take care of the queue of connections if necessary and make sure Peer knows
        // socket is open.
        this._socket.onopen = function () {
            if (_this._disconnected)
                return;
            _this._sendQueuedMessages();
            logger_1.default.log("Socket open");
            _this._scheduleHeartbeat();
        };
    };
    Socket.prototype._scheduleHeartbeat = function () {
        var _this = this;
        this._wsPingTimer = setTimeout(function () { _this._sendHeartbeat(); }, this.WEB_SOCKET_PING_INTERVAL);
    };
    Socket.prototype._sendHeartbeat = function () {
        if (!this._wsOpen()) {
            logger_1.default.log("Cannot send heartbeat, because socket closed");
            return;
        }
        var message = JSON.stringify({ type: enums_1.ServerMessageType.Heartbeat });
        this._socket.send(message);
        this._scheduleHeartbeat();
    };
    /** Is the websocket currently open? */
    Socket.prototype._wsOpen = function () {
        return !!this._socket && this._socket.readyState == 1;
    };
    /** Send queued messages. */
    Socket.prototype._sendQueuedMessages = function () {
        var e_1, _a;
        //Create copy of queue and clear it,
        //because send method push the message back to queue if smth will go wrong
        var copiedQueue = __spread(this._messagesQueue);
        this._messagesQueue = [];
        try {
            for (var copiedQueue_1 = __values(copiedQueue), copiedQueue_1_1 = copiedQueue_1.next(); !copiedQueue_1_1.done; copiedQueue_1_1 = copiedQueue_1.next()) {
                var message = copiedQueue_1_1.value;
                this.send(message);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (copiedQueue_1_1 && !copiedQueue_1_1.done && (_a = copiedQueue_1.return)) _a.call(copiedQueue_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    /** Exposed send for DC & Peer. */
    Socket.prototype.send = function (data) {
        if (this._disconnected) {
            return;
        }
        // If we didn't get an ID yet, we can't yet send anything so we should queue
        // up these messages.
        if (!this._id) {
            this._messagesQueue.push(data);
            return;
        }
        if (!data.type) {
            this.emit(enums_1.SocketEventType.Error, "Invalid message");
            return;
        }
        if (!this._wsOpen()) {
            return;
        }
        var message = JSON.stringify(data);
        this._socket.send(message);
    };
    Socket.prototype.close = function () {
        if (!this._disconnected && !!this._socket) {
            this._socket.close();
            this._disconnected = true;
            clearTimeout(this._wsPingTimer);
        }
    };
    return Socket;
}(eventemitter3_1.EventEmitter));
exports.Socket = Socket;
