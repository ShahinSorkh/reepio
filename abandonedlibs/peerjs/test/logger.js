"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var logger_1 = require("../lib/logger");
describe("Logger", function () {
    it("should be disabled by default", function () {
        chai_1.expect(logger_1.default.logLevel).to.eq(logger_1.LogLevel.Disabled);
    });
    it("should be accept new log level", function () {
        var checkedLevels = [];
        logger_1.default.setLogFunction(function (logLevel) {
            checkedLevels.push(logLevel);
        });
        logger_1.default.logLevel = logger_1.LogLevel.Warnings;
        chai_1.expect(logger_1.default.logLevel).to.eq(logger_1.LogLevel.Warnings);
        logger_1.default.log('');
        logger_1.default.warn('');
        logger_1.default.error('');
        chai_1.expect(checkedLevels).to.deep.eq([logger_1.LogLevel.Warnings, logger_1.LogLevel.Errors]);
    });
    it("should accept new log function", function () {
        logger_1.default.logLevel = logger_1.LogLevel.All;
        var checkedLevels = [];
        var testMessage = 'test it';
        logger_1.default.setLogFunction(function (logLevel) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            checkedLevels.push(logLevel);
            chai_1.expect(args[0]).to.eq(testMessage);
        });
        logger_1.default.log(testMessage);
        logger_1.default.warn(testMessage);
        logger_1.default.error(testMessage);
        chai_1.expect(checkedLevels).to.deep.eq([logger_1.LogLevel.All, logger_1.LogLevel.Warnings, logger_1.LogLevel.Errors]);
    });
});
