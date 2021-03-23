//Internal
import { Database } from './Database';
import { Server } from './Server';

class YomiInitialiser {
    static async run(dbpath: string): Promise<void> {
        var db = new Database(dbpath);
        await db.setup();
    
        let server = new Server(db);
    }
}



async function main() {
    let prodPath = '/data/manga';
    let devPath = 'C:/Users/Nlanson/Desktop/Coding/Yomi/test/data/manga';
    
    await YomiInitialiser.run(prodPath);
}

main();
