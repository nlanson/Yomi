import { Database } from './Database';
import { Server } from './Server';

class Main {
    static async __init(dbpath: string): Promise<void> {
        var db = new Database(dbpath);
        await db.setup();
    
        let server = new Server(db);
    }
}



async function main() {
    let prodPath = '/data/manga';
    let devPath = 'C:/Users/Nlanson/Desktop/Coding/Yomi/test/data/manga';
    
    await Main.__init(prodPath);
}

main();
