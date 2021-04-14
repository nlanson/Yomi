"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
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
        let colour;
        switch (level) {
            case 'ERROR':
                colour = 'red';
                break;
            case `DEBUG`:
                colour = 'yellow';
                break;
            case `WARNING`:
                colour = 'magenta';
                break;
            case `INFO`:
                colour = `green`;
                break;
            default:
                colour = 'white';
        }
        console.log(chalk_1.default[colour](level) + `[${time}] - ${message}`);
    }
    static IntTwoChars(i) {
        return (`0${i}`).slice(-2);
    }
}
exports.Logger = Logger;
