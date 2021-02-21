import e from 'express';
import express from 'express';
const upload = require('express-fileupload');
import fs from 'fs';
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
            this.mangadb[i].pageCount = this.getPageCount(this.mangadb[i].path); //Count how many files are in the path to fugure out how many pages are in the manga.
            if ( this.mangadb[i].pageCount == 0 ) {
                this.mangadb.splice(i, 1); //If there are no pages in the directory, remove it from the db.
                fs.rmdirSync(this.mangadb[i].path, { recursive: true });
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
        //Need to ONLY return the count of files not folders.
        
        return fs.readdirSync(abs_path).length;
    }

    makePagesArray(abs_path: string): Promise<any> { //Creates an array of manga pages from paths.
        return new Promise((resolve) => {
            var pages: String[] = [];
            fs.readdir(abs_path, (err, files) => {
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

        this.init_server();
        
    }

    init_server() {
        this.app.use(upload());
        
        this.refreshdb();
        this.searchByTitle();
        this.listdb();
        this.editManga();
        this.upload();

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
                    res.status(200).send(this.db.mangadb[i]);
                }
                i++
            }

            if ( found == false ) res.status(411).send({message: 'Manga not found'});
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
                res.status(200).send({message: 'Refresed.'});
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
                            res.status(200).send({message: message}); // Full success
                        } else{
                            res.status(510).send({message: message}); //Partial success. Manga was valid but rename failed.
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
                    found: found,
                    message: message
                }
                res.status(411).send(response); //Respond with found = false and manga not found.
            }
        });
    }

    upload() {
        this.app.get('/upload', (req: any, res: any) => {
            res.status(412)({status: 'failed', message: `You've requested this the wrong way.`})
        })
        
        this.app.post('/upload', (req: any, res: any) => {
            if ( req.files ) {
                console.log('Recieving Upload...')
                let file = req.files.file;
                let filename = file.name;

                file.mv(this.db.dbpath + '/' + filename, async (err: any) => { //Move received upload to dbpath/upload.zip
                    if(err) { //If move fails return error
                        res.status(510).send({status: 'failed', message: 'Failed in file.mv()'});
                        console.log('Upload Failed at mv().');
                    }
                    else { 
                        console.log('Upload Success')

                        //IF move is successful:
                        let filetype = path.extname(this.db.dbpath + '/' + filename); //Get file type
                        let valid: Boolean = false;
                        if(filetype == '.zip') { //If file type is ZIP, the run the validateZIP function.
                            try {
                                valid = await this.validateZip(filename)
                            } catch(error) {
                                console.log(error);
                                valid = false;
                            }
                        } 

                        if ( valid == true ) {
                            res.status(200).send({message:'Uploaded and Unpacked'});
                        } else {
                            res.status(414).send({message:'Uploaded but Invalid'});
                        }
                    }
                })
            } else {
                res.status(413).send({message: 'Failed, no file uploaded.'})
            }
        })
    }

    async validateZip(zipFile: String): Promise<Boolean> { //Validates the uploaded zip file.
        return new Promise(async (resolve, reject) => {
            let temp = this.db.dbpath + '/temp/';
            const zip = await fs.createReadStream(this.db.dbpath + '/' + zipFile) //Extract ZIP to /temp/ folder.
                .pipe(unzipper.Extract({ path: temp }))
                .on('close', async () => {
                    //When unzipping finishes, run the validator code on the temp direcetory.
                    let validator = new UploadValidator(temp, this.db, this.db.dbpath + '/' + zipFile);
                    let valid = await validator.validate();
                    
                    if (valid) resolve(true);
                    else  resolve(false);
                });   
        });
    }

}//END Server Class

export class UploadValidator {

    temp: string;
    real: Database;
    zip: string;
    
    constructor(
        temp: string,
        real: Database,
        zip: string
    ) {
        this.temp = temp;
        this.real = real;
        this.zip = zip;
    }

    async validate() { //Validator Code.
        let tempdb: any = await this.scan_temp();  //Creates a temporary db to track files/dirs in the temp folder.
        for ( let i=0; i < tempdb.length; i++ ) {
            tempdb.pageCount = this.getPageCount(tempdb[i].path); 
            if ( tempdb.pageCount == 0 ) { //IF a directory in temp folder has no content, then remove it and delete it from the temp folder.
                tempdb.splice(i, 1); 
                if ( fs.statSync(tempdb[i].path).isDirectory() ) {
                    fs.rmdirSync(tempdb[i].path, { recursive: true });
                }
                continue
            }
        }
        
        let mvError = await this.mv(tempdb); //move contents of temp directory into the live database.
        if ( mvError ) {
            //If the moves fails
            console.log('Failed at mv()');
            this.deleteZip();
            return false
        } else {
            //If the move succeeds, delete the temp folder and zip.
            this.delelteTemp();
            this.deleteZip();
            return true;
        }
    }

    async scan_temp() { //scans the temp directory for any directories and adds them into tempdb. (Code reused from Database Class)
        return new Promise((resolve) => {
            var mangasList: any[] = [];
            fs.readdir(this.temp, (err, files) => {
                if ( files == undefined  ) {
                    console.log('files undefined in temp (340)')
                    resolve(mangasList);
                } else {
                    files.forEach((file) => {
                        let fileDir = path.join(this.temp, file);
                        if ( fs.statSync(fileDir).isDirectory() ) { //If the file in this.dbpath is a directory, add to the mangas list.
                            mangasList.push({
                                title: file,
                                path: fileDir
                            });
                        } else {
                            fs.unlink(fileDir, (err) => {
                                if (err) console.log(err)
                            })
                        }
                    });
                    resolve(mangasList);
                }
            }); 
        });
    }

    getPageCount(abs_path: string): number { //Counts how many pages in a temp manga dir.
        return fs.readdirSync(abs_path).length;
    }

    async mv(tempdb: any) { //Moves valid manga in the tempdb to the live database.
        let error: boolean = false;

        if ( tempdb.length == 0 ) return true;
        
        for ( let i=0; i < tempdb.length; i++ ) {
            fs.rename(tempdb[i].path, this.real.dbpath + '/' + tempdb[i].title, (err) => {
                if (err) console.log(err)
                error = true;
            });
        }

        return error;
    }

    async delelteTemp() { //Deletes the temp directory and uploaded zip.
        console.log('Deleting temp...');
        fs.rmdir(this.temp, (err) => {
            if (err) console.log(err)
        });
    }

    async deleteZip() {
        console.log('Deleting ZIP');
        fs.unlink(this.zip, (err) => {
            if (err) console.log(err)
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