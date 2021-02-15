import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 6969;


/*
DB Structure:
[
    {
        title: string, //Title of manga (Taken from dir name)
        path: string, //Path of manga (Path for manga dir)
        pages: Array<string>, //List of pages for manga (Within the path dir)
        cover: string //First page of the manga (From pages list)
    }
]
*/

class Database {
    dbpath: string;
    mangadb: any;
    
    constructor(dbpath: string) {
        this.dbpath = dbpath;
    }

    async setup() { //Initial DB Setup
        this.mangadb = await this.scan_dir();
        await this.init_db();
    }

    async refresh() { //For refreshing the DB from API
        this.mangadb = await this.scan_dir();
        await this.init_db();
    }
    
    //Scans for any directories that could contain manga in the Database Path.
    scan_dir() {
        console.log('Scanning...');
        
        return new Promise((resolve) => {
            var mangasList: any[] = [];
            fs.readdir(this.dbpath, (err, files) => {
                files.forEach((file) => {
                    let fileDir = path.join(this.dbpath, file);
                    if ( fs.statSync(fileDir).isDirectory() ) { //If the file in this.dbpath is a directory, add to the mangas list.
                        mangasList.push({
                            title: file,
                            path: fileDir
                        });
                    }
                });
                console.log('DONE');
                resolve(mangasList);
            }); 
        });
    }
    
    //Initiales the DB from scanned dirs.
    async init_db() {
        console.log('Creating DB')
        for ( let i = 0; i < this.mangadb.length; i++ ) {
            this.mangadb[i].pageCount = this.getPageCount(this.mangadb[i].path); //Count how many files are in the path to fugure out how many pages are in the manga.
            if ( this.mangadb[i].pageCount == 0 ) {
                this.mangadb.splice(i, 1); //If there are no pages in the directory, remove it from the db.
                continue
            }

            this.mangadb[i].pages = await this.makePagesArray(this.mangadb[i].path); //Create an array of pages and their directories.
            this.mangadb[i].cover = this.addPreview(this.mangadb[i].pages) //Creates a cover property with the first page of the manga as the value.
        }
        console.log('DONE')
    }
    
    addPreview(pages: Array<any>) {
        return pages[0];
    }

    getPageCount(abs_path: string): number { //Counts how many pages in a manga dir.
        return fs.readdirSync(abs_path).length;
    }

    makePagesArray(abs_path: string): Promise<any> { //Creates an array of manga pages from paths.
        return new Promise((resolve) => {
            var pages: String[] = [];
            fs.readdir(abs_path, (err, files) => {
                files.forEach((file) => {
                    //TODO: Only push jpg, png or jpeg file types as often manga downloaded contains ads in pdf or html format.
                    pages.push(abs_path + '/' + file);
                });
                resolve(pages);
            }); 
        })
    }

}//END DB Class


class Server {
    app: any;
    db: Database;

    constructor(app: any, db: Database) {
        this.app = app;
        this.db = db;

        //List all the api requests here.
        this.refreshdb();
        this.searchByTitle();
        this.listdb();

        this.listen();
    }

    listen() { //Starts API
        this.app.listen(port, () => {
            console.log(`Yomi Server listening at http://localhost:${port}`)
        });
    }

    searchByTitle() { //Search the manga by title using api request /manga/{title}
                      //Returns the Manga info such as title, path and page count as well as array of page paths.
        this.app.get('/manga/:title', (req: any, res: any) => {
            let search = req.params.title;
            console.log(`Searched requested for ${search}`);
            
            let found: boolean = false;
            let i:number = 0;
            while ( i < this.db.mangadb.length && found == false ) {
                if ( this.db.mangadb[i].title == req.params.title ) {
                    found = true;
                    res.json(this.db.mangadb[i]);
                }
                i++
            }

            if ( found == false ) res.json({status: 'Not Found'});
        });
    }

    listdb() { //List the DB to api request /list.
               // Can be used to list all manga in the DB to click and open.
        this.app.get('/list', (req: any, res: any) => {
            console.log('List requested.')
            let list = [];
            for (let manga in this.db.mangadb) {
                const listEntry = (({ pages, ...manga }) => manga)(this.db.mangadb[manga]) // Remove pages property from mangadb entries and push into list.
                list.push(listEntry);
            }
            
            res.json(list);
        });
    }

    refreshdb() { //Refreshes the DB
        this.app.get('/refresh', (req: any, res: any) => {
            console.log('Refresh requested.')
            this.db.refresh();
            res.json({status: 'Refreshed.'})
        })
    }
}//END Server Class




async function main() {
    var dbpath = '/data/manga' //Will be docker manga volume.
    var db = new Database(dbpath);
    await db.setup();
    
    let server = new Server(app, db);
}

main();