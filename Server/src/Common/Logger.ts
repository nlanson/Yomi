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
        
        console.log(`${level} [${time}] - ${message}`);
    }

    private static IntTwoChars(i: number) {
        return (`0${i}`).slice(-2);
    }
}