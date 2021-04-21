//Internal
import { CollectionEngine } from './Collections/CollectionEngine';
import { Database } from './Database';
import { Server } from './Server';
import { Logger } from './Common/Logger';

type env = 'prod' | 'dev';

class YomiInitialiser {
    static async run(dbpath: string, coljsonpath:string, env?: env): Promise<void> {
        if (env && env == 'prod') {
            await this.instantiate('/data/manga', '/data/collections.json');
        } else {
            Logger.log('INFO', 'Running Yomi Server in Dev Mode.')
            await this.instantiate(dbpath, coljsonpath);
        }
    }

    static async instantiate(dbpath: string, coljsonpath: string) {
        var mdb: Database = new Database(dbpath);
        await mdb.setup();

        var cdb: CollectionEngine = new CollectionEngine(coljsonpath, mdb); //use /data/collections.json for prod
        await cdb.setup(); //Does nothing atm.
    
        let server = new Server(mdb, cdb); //Make collection data accessible through API, pass param here.
    }
}


/*
    Run modes for Yomi:
        dev: 
            Uses local directories as configured in lines 38 and 39 to run the server. 
        
        prod:
            Uses docker volume directories. Use this param option when building a docker image.
*/
async function main() {
    //My local development folders. Change if different.
    let d: string = 'C:/Users/Nlanson/Desktop/Coding/Yomi/test/data/manga'; //Location of manga
    let c: string = 'C:/Users/Nlanson/Desktop/Coding/Yomi/test/data/collections.json'; //Location of collections.json
    
    await YomiInitialiser.run(d, c, 'prod');
}

main();