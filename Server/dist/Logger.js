"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    constructor() { }
    static getCurrentTime() {
        let date = new Date();
        let hour = date.getHours();
        let minute = date.getMinutes();
        let second = date.getSeconds();
        let time = `${hour}:${minute}:${second}`;
        return time;
    }
    static log(level, message) {
        let time = this.getCurrentTime();
        console.log(`${level} [${time}] - ${message}`);
    }
}
exports.Logger = Logger;
