'use strict';

const winston = require('winston');
const moment = require('moment');
const path = require('path');
const config = require('winston/lib/winston/config');
const cluster = require('cluster');
const colors = require('colors');
const prettyError = require('pretty-error');
const prettyjson = require('prettyjson');
var PROJECT_ROOT = path.join(__dirname, '..');


function shouldLogMeta(obj) {
    if (obj.meta instanceof Error) {
        if (process.env.DEBUG) {
            let pe = new prettyError();
            pe.skipNodeFiles();
            pe.skipPackage('once', 'co', 'newrelic', 'restify');
            console.log(pe.render(obj.meta));
        }
        obj.meta = obj.meta.toString().red;
        return true;
    } else if (typeof obj.meta  == 'object') {
        //Reason we're checking this way is because it's crazy fast.
        for (const x in obj.meta) {
            obj.meta = prettyjson.render(obj.meta);
            return true;
        }
        return false;
    }

    return true;
}

module.exports = {
    getLogger: function (context) {
        return new (winston.Logger)({
            transports: [
                new winston.transports.Console({
                    prettyPrint: true,
                    colorize: true,
                    formatter: function (args) {
                        let currentCluster = 'main';
                        if (cluster.worker) {
                            currentCluster = cluster.worker.id;
                        }

                        let sourceStr = `${moment().format('YYYY-MM-DD hh:mm:ss,SSS')} ${args.level.toUpperCase()} [${context}][${currentCluster}]`;
                        if (process.env.DEBUG) {
                            const stackInfo = getStackInfo(8);
                            const debugData = `${stackInfo.relativePath}.${stackInfo.method}:${stackInfo.line} `;
                            sourceStr = `${sourceStr} ${debugData.yellow}`;
                        }

                        return shouldLogMeta(args) ? `${config.colorize(args.level, sourceStr)} ${args.message} \n${args.meta}` : `${config.colorize(args.level, sourceStr)} ${args.message}`;
                    }
                }),
                new winston.transports.File({
                    filename: path.resolve(__dirname, '../app.log'),
                    maxsize: 1024 * 1024 * 10
                })
            ]
        });
    }
};

/**
 * Parses and returns info about the call stack at the given index.
 */
function getStackInfo (stackIndex) {
    // get call stack, and analyze it
    // get all file, method, and line numbers
    var stacklist = (new Error()).stack.split('\n').slice(3)

    // stack trace format:
    // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    // do not remove the regex expresses to outside of this method (due to a BUG in node.js)
    var stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi
    var stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi

    var s = stacklist[stackIndex] || stacklist[0]
    var sp = stackReg.exec(s) || stackReg2.exec(s)

    if (sp && sp.length === 5) {
        return {
            method: sp[1],
            relativePath: path.relative(PROJECT_ROOT, sp[2]),
            line: sp[3],
            pos: sp[4],
            file: path.basename(sp[2]),
            stack: stacklist.join('\n')
        }
    }
}