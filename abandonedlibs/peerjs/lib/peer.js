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
Object.defineProperty(exports, "__esModule", { value: true });
var eventemitter3_1 = require("eventemitter3");
var util_1 = require("./util");
var logger_1 = require("./logger");
var socket_1 = require("./socket");
var mediaconnection_1 = require("./mediaconnection");
var dataconnection_1 = require("./dataconnection");
var enums_1 = require("./enums");
var api_1 = require("./api");
var PeerOptions = /** @class */ (function () {
    function PeerOptions() {
    }
    return PeerOptions;
}());
/**
 * A peer who can initiate connections with other peers.
 */
var Peer = /** @class */ (function (_super) {
    __extends(Peer, _super);
    function Peer(id, options) {
        var _this = _super.call(this) || this;
        // States.
        _this._destroyed = false; // Connections have been killed
        _this._disconnected = false; // Connection to PeerServer killed but P2P connections still active
        _this._open = false; // Sockets and such are not yet open.
        _this._connections = new Map(); // All connections for this peer.
        _this._lostMessages = new Map(); // src => [list of messages]
        // Deal with overloading
        if (id && id.constructor == Object) {
            options = id;
            id = undefined;
        }
        else if (id) {
            id = id.toString();
        }
        // Configurize options
        options = __assign({ debug: 0, host: util_1.util.CLOUD_HOST, port: util_1.util.CLOUD_PORT, path: "/", key: Peer.DEFAULT_KEY, token: util_1.util.randomToken(), config: util_1.util.defaultConfig }, options);
        _this._options = options;
        // Detect relative URL host.
        if (options.host === "/") {
            options.host = window.location.hostname;
        }
        // Set path correctly.
        if (options.path[0] !== "/") {
            options.path = "/" + options.path;
        }
        if (options.path[options.path.length - 1] !== "/") {
            options.path += "/";
        }
        // Set whether we use SSL to same as current host
        if (options.secure === undefined && options.host !== util_1.util.CLOUD_HOST) {
            options.secure = util_1.util.isSecure();
        }
        else if (options.host == util_1.util.CLOUD_HOST) {
            options.secure = true;
        }
        // Set a custom log function if present
        if (options.logFunction) {
            logger_1.default.setLogFunction(options.logFunction);
        }
        logger_1.default.logLevel = options.debug;
        // Sanity checks
        // Ensure WebRTC supported
        if (!util_1.util.supports.audioVideo && !util_1.util.supports.data) {
            _this._delayedAbort(enums_1.PeerErrorType.BrowserIncompatible, "The current browser does not support WebRTC");
            return _this;
        }
        // Ensure alphanumeric id
        if (!util_1.util.validateId(id)) {
            _this._delayedAbort(enums_1.PeerErrorType.InvalidID, "ID \"" + id + "\" is invalid");
            return _this;
        }
        _this._api = new api_1.API(options);
        // Start the server connection
        _this._initializeServerConnection();
        if (id) {
            _this._initialize(id);
        }
        else {
            _this._api.retrieveId()
                .then(function (id) { return _this._initialize(id); })
                .catch(function (error) { return _this._abort(enums_1.PeerErrorType.ServerError, error); });
        }
        return _this;
    }
    Object.defineProperty(Peer.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "options", {
        get: function () {
            return this._options;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "open", {
        get: function () {
            return this._open;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "socket", {
        get: function () {
            return this._socket;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "connections", {
        /**
         * @deprecated
         * Return type will change from Object to Map<string,[]>
         */
        get: function () {
            var e_1, _a;
            var plainConnections = Object.create(null);
            try {
                for (var _b = __values(this._connections), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), k = _d[0], v = _d[1];
                    plainConnections[k] = v;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return plainConnections;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "destroyed", {
        get: function () {
            return this._destroyed;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "disconnected", {
        get: function () {
            return this._disconnected;
        },
        enumerable: true,
        configurable: true
    });
    // Initialize the 'socket' (which is actually a mix of XHR streaming and
    // websockets.)
    Peer.prototype._initializeServerConnection = function () {
        var _this = this;
        this._socket = new socket_1.Socket(this._options.secure, this._options.host, this._options.port, this._options.path, this._options.key);
        this.socket.on(enums_1.SocketEventType.Message, function (data) {
            _this._handleMessage(data);
        });
        this.socket.on(enums_1.SocketEventType.Error, function (error) {
            _this._abort(enums_1.PeerErrorType.SocketError, error);
        });
        this.socket.on(enums_1.SocketEventType.Disconnected, function () {
            // If we haven't explicitly disconnected, emit error and disconnect.
            if (!_this.disconnected) {
                _this.emitError(enums_1.PeerErrorType.Network, "Lost connection to server.");
                _this.disconnect();
            }
        });
        this.socket.on(enums_1.SocketEventType.Close, function () {
            // If we haven't explicitly disconnected, emit error.
            if (!_this.disconnected) {
                _this._abort(enums_1.PeerErrorType.SocketClosed, "Underlying socket is already closed.");
            }
        });
    };
    /** Initialize a connection with the server. */
    Peer.prototype._initialize = function (id) {
        this._id = id;
        this.socket.start(this.id, this._options.token);
    };
    /** Handles messages from the server. */
    Peer.prototype._handleMessage = function (message) {
        var e_2, _a;
        var type = message.type;
        var payload = message.payload;
        var peerId = message.src;
        switch (type) {
            case enums_1.ServerMessageType.Open: // The connection to the server is open.
                this.emit(enums_1.PeerEventType.Open, this.id);
                this._open = true;
                break;
            case enums_1.ServerMessageType.Error: // Server error.
                this._abort(enums_1.PeerErrorType.ServerError, payload.msg);
                break;
            case enums_1.ServerMessageType.IdTaken: // The selected ID is taken.
                this._abort(enums_1.PeerErrorType.UnavailableID, "ID \"" + this.id + "\" is taken");
                break;
            case enums_1.ServerMessageType.InvalidKey: // The given API key cannot be found.
                this._abort(enums_1.PeerErrorType.InvalidKey, "API KEY \"" + this._options.key + "\" is invalid");
                break;
            case enums_1.ServerMessageType.Leave: // Another peer has closed its connection to this peer.
                logger_1.default.log("Received leave message from", peerId);
                this._cleanupPeer(peerId);
                this._connections.delete(peerId);
                break;
            case enums_1.ServerMessageType.Expire: // The offer sent to a peer has expired without response.
                this.emitError(enums_1.PeerErrorType.PeerUnavailable, "Could not connect to peer " + peerId);
                break;
            case enums_1.ServerMessageType.Offer: {
                // we should consider switching this to CALL/CONNECT, but this is the least breaking option.
                var connectionId = payload.connectionId;
                var connection = this.getConnection(peerId, connectionId);
                if (connection) {
                    connection.close();
                    logger_1.default.warn("Offer received for existing Connection ID:", connectionId);
                }
                // Create a new connection.
                if (payload.type === enums_1.ConnectionType.Media) {
                    connection = new mediaconnection_1.MediaConnection(peerId, this, {
                        connectionId: connectionId,
                        _payload: payload,
                        metadata: payload.metadata
                    });
                    this._addConnection(peerId, connection);
                    this.emit(enums_1.PeerEventType.Call, connection);
                }
                else if (payload.type === enums_1.ConnectionType.Data) {
                    connection = new dataconnection_1.DataConnection(peerId, this, {
                        connectionId: connectionId,
                        _payload: payload,
                        metadata: payload.metadata,
                        label: payload.label,
                        serialization: payload.serialization,
                        reliable: payload.reliable
                    });
                    this._addConnection(peerId, connection);
                    this.emit(enums_1.PeerEventType.Connection, connection);
                }
                else {
                    logger_1.default.warn("Received malformed connection type:", payload.type);
                    return;
                }
                // Find messages.
                var messages = this._getMessages(connectionId);
                try {
                    for (var messages_1 = __values(messages), messages_1_1 = messages_1.next(); !messages_1_1.done; messages_1_1 = messages_1.next()) {
                        var message_1 = messages_1_1.value;
                        connection.handleMessage(message_1);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (messages_1_1 && !messages_1_1.done && (_a = messages_1.return)) _a.call(messages_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                break;
            }
            default: {
                if (!payload) {
                    logger_1.default.warn("You received a malformed message from " + peerId + " of type " + type);
                    return;
                }
                var connectionId = payload.connectionId;
                var connection = this.getConnection(peerId, connectionId);
                if (connection && connection.peerConnection) {
                    // Pass it on.
                    connection.handleMessage(message);
                }
                else if (connectionId) {
                    // Store for possible later use
                    this._storeMessage(connectionId, message);
                }
                else {
                    logger_1.default.warn("You received an unrecognized message:", message);
                }
                break;
            }
        }
    };
    /** Stores messages without a set up connection, to be claimed later. */
    Peer.prototype._storeMessage = function (connectionId, message) {
        if (!this._lostMessages.has(connectionId)) {
            this._lostMessages.set(connectionId, []);
        }
        this._lostMessages.get(connectionId).push(message);
    };
    /** Retrieve messages from lost message store */
    //TODO Change it to private
    Peer.prototype._getMessages = function (connectionId) {
        var messages = this._lostMessages.get(connectionId);
        if (messages) {
            this._lostMessages.delete(connectionId);
            return messages;
        }
        return [];
    };
    /**
     * Returns a DataConnection to the specified peer. See documentation for a
     * complete list of options.
     */
    Peer.prototype.connect = function (peer, options) {
        if (options === void 0) { options = {}; }
        if (this.disconnected) {
            logger_1.default.warn("You cannot connect to a new Peer because you called " +
                ".disconnect() on this Peer and ended your connection with the " +
                "server. You can create a new Peer to reconnect, or call reconnect " +
                "on this peer if you believe its ID to still be available.");
            this.emitError(enums_1.PeerErrorType.Disconnected, "Cannot connect to new Peer after disconnecting from server.");
            return;
        }
        var dataConnection = new dataconnection_1.DataConnection(peer, this, options);
        this._addConnection(peer, dataConnection);
        return dataConnection;
    };
    /**
     * Returns a MediaConnection to the specified peer. See documentation for a
     * complete list of options.
     */
    Peer.prototype.call = function (peer, stream, options) {
        if (options === void 0) { options = {}; }
        if (this.disconnected) {
            logger_1.default.warn("You cannot connect to a new Peer because you called " +
                ".disconnect() on this Peer and ended your connection with the " +
                "server. You can create a new Peer to reconnect.");
            this.emitError(enums_1.PeerErrorType.Disconnected, "Cannot connect to new Peer after disconnecting from server.");
            return;
        }
        if (!stream) {
            logger_1.default.error("To call a peer, you must provide a stream from your browser's `getUserMedia`.");
            return;
        }
        options._stream = stream;
        var mediaConnection = new mediaconnection_1.MediaConnection(peer, this, options);
        this._addConnection(peer, mediaConnection);
        return mediaConnection;
    };
    /** Add a data/media connection to this peer. */
    Peer.prototype._addConnection = function (peerId, connection) {
        logger_1.default.log("add connection " + connection.type + ":" + connection.connectionId + "\n       to peerId:" + peerId);
        if (!this._connections.has(peerId)) {
            this._connections.set(peerId, []);
        }
        this._connections.get(peerId).push(connection);
    };
    //TODO should be private
    Peer.prototype._removeConnection = function (connection) {
        var connections = this._connections.get(connection.peer);
        if (connections) {
            var index = connections.indexOf(connection);
            if (index !== -1) {
                connections.splice(index, 1);
            }
        }
        //remove from lost messages
        this._lostMessages.delete(connection.connectionId);
    };
    /** Retrieve a data/media connection for this peer. */
    Peer.prototype.getConnection = function (peerId, connectionId) {
        var e_3, _a;
        var connections = this._connections.get(peerId);
        if (!connections) {
            return null;
        }
        try {
            for (var connections_1 = __values(connections), connections_1_1 = connections_1.next(); !connections_1_1.done; connections_1_1 = connections_1.next()) {
                var connection = connections_1_1.value;
                if (connection.connectionId === connectionId) {
                    return connection;
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (connections_1_1 && !connections_1_1.done && (_a = connections_1.return)) _a.call(connections_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return null;
    };
    Peer.prototype._delayedAbort = function (type, message) {
        var _this = this;
        setTimeout(function () {
            _this._abort(type, message);
        }, 0);
    };
    /**
     * Destroys the Peer and emits an error message.
     * The Peer is not destroyed if it's in a disconnected state, in which case
     * it retains its disconnected state and its existing connections.
     */
    Peer.prototype._abort = function (type, message) {
        logger_1.default.error("Aborting!");
        if (!this._lastServerId) {
            this.destroy();
        }
        else {
            this.disconnect();
        }
        this.emitError(type, message);
    };
    /** Emits a typed error message. */
    Peer.prototype.emitError = function (type, err) {
        logger_1.default.error("Error:", err);
        if (typeof err === "string") {
            err = new Error(err);
        }
        err.type = type;
        this.emit(enums_1.PeerEventType.Error, err);
    };
    /**
     * Destroys the Peer: closes all active connections as well as the connection
     *  to the server.
     * Warning: The peer can no longer create or accept connections after being
     *  destroyed.
     */
    Peer.prototype.destroy = function () {
        if (!this.destroyed) {
            this._cleanup();
            this.disconnect();
            this._destroyed = true;
        }
    };
    /** Disconnects every connection on this peer. */
    Peer.prototype._cleanup = function () {
        var e_4, _a;
        try {
            for (var _b = __values(this._connections.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var peerId = _c.value;
                this._cleanupPeer(peerId);
                this._connections.delete(peerId);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        this.emit(enums_1.PeerEventType.Close);
    };
    /** Closes all connections to this peer. */
    Peer.prototype._cleanupPeer = function (peerId) {
        var e_5, _a;
        var connections = this._connections.get(peerId);
        if (!connections)
            return;
        try {
            for (var connections_2 = __values(connections), connections_2_1 = connections_2.next(); !connections_2_1.done; connections_2_1 = connections_2.next()) {
                var connection = connections_2_1.value;
                connection.close();
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (connections_2_1 && !connections_2_1.done && (_a = connections_2.return)) _a.call(connections_2);
            }
            finally { if (e_5) throw e_5.error; }
        }
    };
    /**
     * Disconnects the Peer's connection to the PeerServer. Does not close any
     *  active connections.
     * Warning: The peer can no longer create or accept connections after being
     *  disconnected. It also cannot reconnect to the server.
     */
    Peer.prototype.disconnect = function () {
        var _this = this;
        setTimeout(function () {
            if (!_this.disconnected) {
                _this._disconnected = true;
                _this._open = false;
                if (_this.socket) {
                    _this.socket.close();
                }
                _this.emit(enums_1.PeerEventType.Disconnected, _this.id);
                _this._lastServerId = _this.id;
                _this._id = null;
            }
        }, 0);
    };
    /** Attempts to reconnect with the same ID. */
    Peer.prototype.reconnect = function () {
        if (this.disconnected && !this.destroyed) {
            logger_1.default.log("Attempting reconnection to server with ID " + this._lastServerId);
            this._disconnected = false;
            this._initializeServerConnection();
            this._initialize(this._lastServerId);
        }
        else if (this.destroyed) {
            throw new Error("This peer cannot reconnect to the server. It has already been destroyed.");
        }
        else if (!this.disconnected && !this.open) {
            // Do nothing. We're still connecting the first time.
            logger_1.default.error("In a hurry? We're still trying to make the initial connection!");
        }
        else {
            throw new Error("Peer " +
                this.id +
                " cannot reconnect because it is not disconnected from the server!");
        }
    };
    /**
     * Get a list of available peer IDs. If you're running your own server, you'll
     * want to set allow_discovery: true in the PeerServer options. If you're using
     * the cloud server, email team@peerjs.com to get the functionality enabled for
     * your key.
     */
    Peer.prototype.listAllPeers = function (cb) {
        var _this = this;
        if (cb === void 0) { cb = function (_) { }; }
        this._api.listAllPeers()
            .then(function (peers) { return cb(peers); })
            .catch(function (error) { return _this._abort(enums_1.PeerErrorType.ServerError, error); });
    };
    Peer.DEFAULT_KEY = "peerjs";
    return Peer;
}(eventemitter3_1.EventEmitter));
exports.Peer = Peer;
