"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    constructor() { }
    static getCurrentTime() {
        let date = new Date();
        let hour = this.IntTwoChars(date.getHours());
        let minute = this.IntTwoChars(date.getMinutes());
        let second = this.IntTwoChars(date.getSeconds());
        let time = `${hour}:${minute}:${second}`;
        return time;
    }
    static log(level, message) {
        let time = this.getCurrentTime();
        console.log(`${level} [${time}] - ${message}`);
    }
    static IntTwoChars(i) {
        return (`0${i}`).slice(-2);
    }
}
exports.Logger = Logger;
