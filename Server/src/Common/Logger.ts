import chalk  from 'chalk';

type Colour = `white` | `red` | `green` | `yellow` | 'magenta';

export class Logger {
    constructor() { }
    
    private static getCurrentTime(): string {
        let date = new Date();
        let hour = this.IntTwoChars(date.getHours());
        let minute = this.IntTwoChars(date.getMinutes());
        let second = this.IntTwoChars(date.getSeconds());

        let time = `${hour}:${minute}:${second}`
        
        return time;
    }
    
    public static log(level: string, message: string): void {
        let time = this.getCurrentTime();
        let colour: Colour;

        switch(level) {
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
        
        console.log(chalk[colour](level) + `[${time}] - ${message}`)
    }

    private static IntTwoChars(i: number) {
        return (`0${i}`).slice(-2);
    }
}


