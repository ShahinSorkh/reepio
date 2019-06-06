"use strict";
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
var util_1 = require("./util");
var logger_1 = require("./logger");
var API = /** @class */ (function () {
    function API(_options) {
        this._options = _options;
    }
    API.prototype._buildUrl = function (method) {
        var protocol = this._options.secure ? "https://" : "http://";
        var url = protocol +
            this._options.host +
            ":" +
            this._options.port +
            this._options.path +
            this._options.key +
            "/" +
            method;
        var queryString = "?ts=" + new Date().getTime() + "" + Math.random();
        url += queryString;
        return url;
    };
    /** Get a unique ID from the server via XHR and initialize with it. */
    API.prototype.retrieveId = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, error_1, pathError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this._buildUrl("id");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch(url)];
                    case 2:
                        response = _a.sent();
                        if (response.status !== 200) {
                            throw new Error("Error. Status:" + response.status);
                        }
                        return [2 /*return*/, response.text()];
                    case 3:
                        error_1 = _a.sent();
                        logger_1.default.error("Error retrieving ID", error_1);
                        pathError = "";
                        if (this._options.path === "/" &&
                            this._options.host !== util_1.util.CLOUD_HOST) {
                            pathError =
                                " If you passed in a `path` to your self-hosted PeerServer, " +
                                    "you'll also need to pass in that same path when creating a new " +
                                    "Peer.";
                        }
                        throw new Error("Could not get an ID from the server." + pathError);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** @deprecated */
    API.prototype.listAllPeers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, helpfulError, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this._buildUrl("peers");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch(url)];
                    case 2:
                        response = _a.sent();
                        if (response.status !== 200) {
                            if (response.status === 401) {
                                helpfulError = "";
                                if (this._options.host === util_1.util.CLOUD_HOST) {
                                    helpfulError =
                                        "It looks like you're using the cloud server. You can email " +
                                            "team@peerjs.com to enable peer listing for your API key.";
                                }
                                else {
                                    helpfulError =
                                        "You need to enable `allow_discovery` on your self-hosted " +
                                            "PeerServer to use this feature.";
                                }
                                throw new Error("It doesn't look like you have permission to list peers IDs. " +
                                    helpfulError);
                            }
                            throw new Error("Error. Status:" + response.status);
                        }
                        return [2 /*return*/, response.json()];
                    case 3:
                        error_2 = _a.sent();
                        logger_1.default.error("Error retrieving list peers", error_2);
                        throw new Error("Could not get list peers from the server." + error_2);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return API;
}());
exports.API = API;
