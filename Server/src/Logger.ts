export class Logger {
    constructor() { }
    
    private static getCurrentTime(): string {
        let date = new Date();
        let hour = date.getHours()
        let minute = date.getMinutes()
        let second = date.getSeconds();
        let time = `${hour}:${minute}:${second}`
        
        return time;
    }
    
    public static log(level: string, message: string): void {
        let time = this.getCurrentTime();
        
        console.log(`${level} [${time}] - ${message}`);
    }
}