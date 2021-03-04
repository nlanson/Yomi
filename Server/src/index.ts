import express, { Request, Response } from 'express';
const upload = require('express-fileupload');
const cors = require('cors');
import fs from 'fs';
const fsPromises = fs.promises;
import path from 'path';
const unzipper = require('unzipper');

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
        return true;
    }
    
    //Scans for any directories that could contain manga in the Database Path.
    scan_dir() {
        console.log('Scanning...');
        
        return new Promise((resolve) => {
            var mangasList: any[] = [];
            fs.readdir(this.dbpath, (err, files) => {
                if ( files == undefined  ) {
                    resolve(mangasList);
                } else {
                    files.forEach((file) => {
                        let fileDir = path.join(this.dbpath, file);
                        if ( fs.statSync(fileDir).isDirectory() ) { //If the file in this.dbpath is a directory, add to the mangas list.
                            mangasList.push({
                                title: file,
                                path: fileDir
                            });
                        } else {
                            console.log(`Deleting ${file} as it is not a directory.`)
                            fs.unlink(fileDir, (err) => {
                                if (err) console.log(err)
                            })
                        }
                    });
                    console.log('DONE');
                    resolve(mangasList);
                }
            }); 
        });
    }
    
    //Initiales the DB from scanned dirs.
    async init_db() {
        console.log('Creating DB')
        for ( let i = 0; i < this.mangadb.length; i++ ) {
            this.mangadb[i].pageCount = await this.getPageCount(this.mangadb[i].path); //Count how many files are in the path to fugure out how many pages are in the manga.
            if ( this.mangadb[i].pageCount == 0 ) {
                console.log(`Deleting ${this.mangadb[i].title} as it has a page count of zero.`)
                fs.rmdirSync(this.mangadb[i].path, { recursive: true });
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


    getPageCount(abs_path: string): Promise<number> { //Counts how many pages in a manga dir.
        return new Promise((resolve) => {
            var pages: String[] = [];
            fs.readdir(abs_path, (err, files) => {
                files.forEach((file) => {
                    let filetype = path.extname(abs_path + '/' + file);
                        //console.log(`${file} is a ${filetype}`);
                        if( //List all accepted page types here.
                            filetype == '.jpg' ||
                            filetype == '.JPG' ||
                            filetype == '.png' ||
                            filetype == '.PNG' ||
                            filetype == '.jpeg' ||
                            filetype == '.JPEG' 
                            ) {
                            pages.push(abs_path + '/' + file);
                        }
                });
                resolve(pages.length);
            }); 
        });
    }

    makePagesArray(abs_path: string): Promise<any> { //Creates an array of manga pages from paths.
        return new Promise((resolve) => {
            var pages: String[] = [];
            fs.readdir(abs_path, (err, files) => {
                //Sort pages by time
                files = files.map(function (fileName) {
                    return {
                        name: fileName,
                        time: fs.statSync(abs_path + '/' + fileName).mtime.getTime()
                    };
                })
                .sort(function (a, b) {
                    return a.time - b.time; })
                .map(function (v) {
                    return v.name;
                });
                
                files.forEach((file) => {
                    let filetype = path.extname(abs_path + '/' + file);
                    if( //List all accepted page types here.
                        filetype == '.jpg' ||
                        filetype == '.JPG' ||
                        filetype == '.png' ||
                        filetype == '.PNG' ||
                        filetype == '.jpeg' ||
                        filetype == '.JPEG' 
                        ) {
                        pages.push(abs_path + '/' + file);
                    }
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

        this.init_server();
        
    }

    init_server() {
        this.app.use(upload());
        this.app.use(cors());
        
        this.refreshdb();
        this.searchByTitle();
        this.listdb();
        this.editManga();
        this.upload();
        this.deleteManga();

        this.listen();
    }
    
    listen() { //Starts API
        this.app.listen(port, () => {
            console.log(`Yomi Server listening at http://localhost:${port}`);
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
                    res.status(200).send(this.db.mangadb[i]);
                }
                i++
            }

            if ( found == false ) res.status(404).send({success: false, message: 'Manga not found'});
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
            
            res.status(200).send(list);
        });
    }

    refreshdb() { //Refreshes the DB
        this.app.get('/refresh', async (req: any, res: any) => {
            console.log('Refresh requested.')
            let status = await this.db.refresh();

            if ( status == true ) {
                res.status(200).send({success: true, message: 'Refresed.'});
            }
        })
    }

    editManga() {
        this.app.get('/editmanga/:edit', async (req: any, res: any) => {
            console.log('Edit Requested');
            let edit = req.params.edit;
            edit = JSON.parse(edit);
            let ogName = edit.title;
            let newName = edit.edit;
            
            let i = 0;
            let found: Boolean = false;
            let message: any;
            while ( i < this.db.mangadb.length && found == false ) { //Loop through every manga
                if ( this.db.mangadb[i].title == ogName ) { //If ogname equals any manga in the db then..,
                    found = true;

                    this.db.mangadb[i].title = newName; //Set manga title to the new name
                    fs.rename(this.db.mangadb[i].path, this.db.dbpath + '/' +newName, (err) => { //Rename old manga path to new manga path.
                        if (err) { message = err;  console.log(err); }
                        else console.log(`Successfully Edited ${ogName} -> ${newName}`);
                        this.db.refresh(); //Refresh DB
                        
                        if (!message) { 
                            message = 'Success';
                            res.status(200).send({success: true, message: message}); // Full success
                        } else{
                            res.status(500).send({success: false, message: message}); //Partial success. Manga was valid but rename failed.
                        }
                        
                    });
                }
                i++;
            }

            //If no match was found, then response with 'manga not found'
            if ( found == false ) {
                console.log('Edit is Invalid');
                message = 'Manga not found';
                let response = {
                    success: found,
                    message: message
                }
                res.status(404).send(response); //Respond with found = false and manga not found.
            }
        });
    }

    upload() {
        this.app.get('/upload', (req: any, res: any) => {
            res.status(405)({status: 'failed', message: `You've requested this the wrong way.`})
        })
        
        this.app.post('/upload', (req: any, res: any) => {
            if ( req.files ) {
                console.log('Recieving Upload...')
                let file = req.files.file;
                let filename = file.name;

                file.mv(this.db.dbpath + '/' + filename, async (err: any) => { //Move received upload to dbpath/upload.zip
                    if(err) { //If move fails return error
                        res.status(510).send({success: false, message: 'Failed recieving the file properly.'});
                        console.log('Upload Failed at mv().');
                    }
                    else { 
                        console.log('Upload Success');

                        //IF move is successful:
                        let archive = this.db.dbpath + '/' + filename;
                        let uh = new UploadHandler(archive, this.db);
                        let result = await uh.handle();

                        switch (result.success) {
                            case ( true ):
                                res.status(200).send(result);
                                break;
                            case ( false ):
                                res.status(200).send(result);
                                break;
                            default:
                                res.status(500).send({success: false, message: 'Handler failed to run.'});
                        }
                    }
                })
            } else {
                res.status(406).send({success: false, message: 'Failed, no file uploaded.'})
            }
        });
    }

    async deleteManga() {
        this.app.get('/deletemanga/:delete', async (req: Request, res: Response) => {
            console.log('Delete Requested');
            let del: any = req.params.delete;
            del = JSON.parse(del);
            del = del.title;

            await fsPromises.rmdir(this.db.dbpath + '/' + del, { recursive: true });

            res.status(200).send({success: true, message: `${del} was deleted.`});
        });
    }

}//END Server Class


interface CommonHandlerResult {
    success: Boolean,
    message: string
}

class UploadHandler {

    file: string;
    filetype: string;
    db: Database;
    temp: string;
    tempdb: Array<any> = [];

    constructor(
        file: string,
        db: Database
    ) {
        this.file = file;
        this.db = db;
        this.temp = this.db.dbpath + '/temp/';
        this.filetype = this.getFileType();
    }

    //Method to call.
    async handle(): Promise<CommonHandlerResult> {
        let response: CommonHandlerResult = {success: false, message: 'unhandled.'}
        return new Promise(async (resolve, reject) => {
            try {
                await this.unarchive();
            } catch (error) {
                console.log(error.message);
                response.success = false;
                response.message = error.message;
                resolve(response);
            }

            try {
                await this.scan_temp();
                if ( this.tempdb.length == 0 ) {
                    response.success = false;
                    response.message = 'No valid files were in the archive.'
                    resolve(response);
                }
            } catch (e) {
                console.log(e.message);
                response.success = false;
                response.message = e.message;
                resolve(response);
            }

            try {
                await this.pageValidator();
                if ( this.tempdb.length == 0 ) {
                    response.success = false;
                    response.message = 'No valid files were in the archive.'
                    resolve(response);
                }
            } catch (e) {
                console.log(e.message);
                response.success = false;
                response.message = e.message;
                resolve(response);
            }

            try {
                await this.mv();
            } catch (e) {
                console.log(e.message);
                response.success = false;
                response.message = 'No valid files were in the archive.'
                resolve(response);
            }

            try {
                this.deleteDir(this.temp);
                this.deleteFile(this.file);
            } catch (e) {
                console.log(e.message);
                response.success = false;
                response.message = 'No valid files were in the archive.'
                resolve(response);
            }

            response.success = true;
            response.message = 'Uploaded and Unpacked';
            resolve(response);

        });
    }

    getFileType() {
        let filetype = path.extname(this.file);
        return filetype;
    }

    async unarchive(): Promise<CommonHandlerResult> {
        return new Promise( async (resolve, reject) => {
            let result: CommonHandlerResult = { success: false, message: 'unarchiver failure'}
            switch ( this.filetype ) {
                case('.zip'):
                    result = await this.unzip();
                    resolve(result);
                    break;
                default:
                    reject(new Error(`Unsupported file type "${this.filetype}"`))
            }
        });
    }

    async unzip(): Promise<CommonHandlerResult> {
        return new Promise( async (resolve, reject) => {
            const zip = await fs.createReadStream(this.file) //Extract ZIP to /temp/ folder.
                .pipe(unzipper.Extract({ path: this.temp }))
                .on('close', async () => {
                    let result = { success: true, message: 'Unzipped.'}
                    resolve(result);
                })
                .on('error', async () => {
                    reject(new Error('Unzipping read stream gave an error.'))
                });
        });
    }
    
    async scan_temp(): Promise<CommonHandlerResult> {
        return new Promise(async (resolve, reject) => {
            let files = await fsPromises.readdir(this.temp);
            for await (let file of files) {
                console.log(file);
                let fileDir = path.join(this.temp, file);
                //If the file in this.dbpath is a directory, do the dupe detection.  
                if ( fs.statSync(fileDir).isDirectory() ) {       
                    //Dupe Detection Loop. Checks if there are any dupes in the real db.
                    let inval = false;
                    let dupe_UI = 1;
                    do {
                        let check = await this.checkForInvalidFileName(file);
                        if ( !check ) {
                            //If the directory is not a duplicate, add it to the tempdb.
                            inval = false;
                            this.tempdb.push({
                                title: file,
                                path: fileDir
                            });
                        } else {
                            //If the directory is a dupe, tag it with the dupe_UI and reloop.
                            inval = true;
                            console.log(`${file} is an invalid name.`);
                            file = file + `(${dupe_UI.toString()})`;
                            dupe_UI++
                        }
                    } while ( inval == true );
                } else { 
                    // If the file is not a directory purge it,
                    fs.unlink(fileDir, (err) => {
                        if (err) reject(new Error(`fs.unlink() gave an error while deleting ${file}`));
                    });
                }
            }
            resolve({success: true, message: 'Temp scanned'});
        });
    }

    async checkForInvalidFileName(title: string): Promise<Boolean> {
        return new Promise((resolve, reject) => {
            let i=0;
            let found: Boolean = false;

            while ( i<this.db.mangadb.length && found == false ) {
                if ( (this.db.mangadb[i].title == title) || (title == 'temp')) {
                    found = true;
                }
                i++
            }

            resolve(found);
        })
    }

    async pageValidator(): Promise<CommonHandlerResult> {
        return new Promise( async (resolve, reject) => {
            for ( let i=0; i < this.tempdb.length; i++ ) {
                try {
                    if ( fs.statSync(this.tempdb[i].path).isDirectory() ) {
                        this.tempdb[i].pageCount = await this.getPageCount(this.tempdb[i].path); 
                    }
                } catch (e) {
                    console.log(e.message);
                    reject(new Error(e.message));
                }

                if ( this.tempdb[i].pageCount == 0 ) { 
                    console.log(`${this.tempdb[i].path} has no valid pages.`)
                    if ( fs.statSync(this.tempdb[i].path).isDirectory() ) {
                        fs.rmdirSync(this.tempdb[i].path, { recursive: true });
                    }
                    this.tempdb.splice(i, 1); 
                    continue
                }
            }
            let response = { success: true, message: 'Pages Validated' }
            resolve(response)
        })
    }

    getPageCount(manga_path: string): Promise<number> { //Counts how many pages in a temp manga dir.
        return new Promise((resolve, reject) => {
            var pages: number = 0;
            fs.readdir(manga_path, (err, files) => {
                if (err) reject(new Error('fs.readdir() threw an error whilst counting pages.'));
                files.forEach((file) => { //Only push images
                    let filetype = path.extname(this.temp + '/' + file);
                        if(
                            filetype == '.jpg' ||
                            filetype == '.JPG' ||
                            filetype == '.png' ||
                            filetype == '.PNG' ||
                            filetype == '.jpeg' ||
                            filetype == '.JPEG'
                            ) {
                            pages++
                        }
                });
                resolve(pages);
            }); 
        });
    }

    async mv(): Promise<CommonHandlerResult> {
        return new Promise((resolve, reject) => {
            for ( let i=0; i < this.tempdb.length; i++ ) {
                fs.rename(this.tempdb[i].path, this.db.dbpath + '/' + this.tempdb[i].title, (err) => {
                    if (err) reject(new Error(`Failed migrating ${this.tempdb[i].path} to live database.`))
                });
            }
    
            let response: CommonHandlerResult = { success: true, message: 'Move successful.' }
            resolve(response);
        });   
    }

    deleteDir(dir: string) {
        fs.rmdir(dir, (err) => {
            if (err) throw new Error(`Directory ${dir} could not be deleted: ${err}`);
        });
    }

    deleteFile(file: string) {
        fs.unlink(file, (err) => {
            if (err) throw new Error(`File ${file} could not be deleted: ${err}`);
        })
    }

}




async function main() {
    let prodPath = '/data/manga';
    let devPath = 'C:/Users/Nlanson/Desktop/Coding/Yomi/test/data/manga';

    var dbpath = prodPath;
    var db = new Database(dbpath);
    await db.setup();
    
    let server = new Server(app, db);
}

main();
