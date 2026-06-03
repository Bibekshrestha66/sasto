"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeDebugLog = writeDebugLog;
var fs_1 = require("fs");
var path_1 = require("path");
var SESSION_ID = "90368c";
var INGEST_URL = "http://127.0.0.1:7884/ingest/4eb48921-d438-46ea-8ea8-0991e31d49ad";
// Write under the project root regardless of where the server is started from.
var LOG_PATH = path_1.default.resolve(import.meta.dirname, "../..", "debug-90368c.log");
function writeDebugLog(payload) {
    // #region agent log
    var line = JSON.stringify(payload) + "\n";
    try {
        fs_1.default.appendFileSync(LOG_PATH, line, { encoding: "utf8" });
    }
    catch (_a) {
        // Never block server execution due to logging.
    }
    try {
        var f = globalThis.fetch;
        if (typeof f === "function") {
            f(INGEST_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Debug-Session-Id": SESSION_ID,
                },
                body: JSON.stringify(payload),
            }).catch(function () { });
        }
    }
    catch (_b) {
        // ignore
    }
    // #endregion
}
