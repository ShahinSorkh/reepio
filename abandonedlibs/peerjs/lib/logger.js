"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var LOG_PREFIX = 'PeerJS: ';
/*
Prints log messages depending on the debug level passed in. Defaults to 0.
0  Prints no logs.
1  Prints only errors.
2  Prints errors and warnings.
3  Prints all logs.
*/
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Disabled"] = 0] = "Disabled";
    LogLevel[LogLevel["Errors"] = 1] = "Errors";
    LogLevel[LogLevel["Warnings"] = 2] = "Warnings";
    LogLevel[LogLevel["All"] = 3] = "All";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
var Logger = /** @class */ (function () {
    function Logger() {
        this._logLevel = LogLevel.Disabled;
    }
    Object.defineProperty(Logger.prototype, "logLevel", {
        get: function () { return this._logLevel; },
        set: function (logLevel) { this._logLevel = logLevel; },
        enumerable: true,
        configurable: true
    });
    Logger.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this._logLevel >= LogLevel.All) {
            this._print.apply(this, __spread([LogLevel.All], args));
        }
    };
    Logger.prototype.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this._logLevel >= LogLevel.Warnings) {
            this._print.apply(this, __spread([LogLevel.Warnings], args));
        }
    };
    Logger.prototype.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this._logLevel >= LogLevel.Errors) {
            this._print.apply(this, __spread([LogLevel.Errors], args));
        }
    };
    Logger.prototype.setLogFunction = function (fn) {
        this._print = fn;
    };
    Logger.prototype._print = function (logLevel) {
        var rest = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            rest[_i - 1] = arguments[_i];
        }
        var copy = __spread([LOG_PREFIX], rest);
        for (var i in copy) {
            if (copy[i] instanceof Error) {
                copy[i] = "(" + copy[i].name + ") " + copy[i].message;
            }
        }
        if (logLevel >= LogLevel.All) {
            console.log.apply(console, __spread(copy));
        }
        else if (logLevel >= LogLevel.Warnings) {
            console.warn.apply(console, __spread(["WARNING"], copy));
        }
        else if (logLevel >= LogLevel.Errors) {
            console.error.apply(console, __spread(["ERROR"], copy));
        }
    };
    return Logger;
}());
exports.default = new Logger();
