//External
import fs from 'fs';
const fsPromises = fs.promises;
import path from 'path';
const unzipper = require('unzipper');

//Internal
import { Database } from './Database'
import { CommonHandlerResult } from './Common/Interfaces';
import { Logger } from './Common/Logger';


export class UploadHandler {

    private file: string;
    private filetype: string;
    private db: Database;
    private temp: string;
    private tempdb: Array<any> = [];

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
    public async handle(): Promise<CommonHandlerResult> {
        let response: CommonHandlerResult = {success: false, message: 'unhandled.'}
        return new Promise(async (resolve, reject) => {
            try {
                await this.unarchive();
            } catch (error) {
                Logger.log('ERROR', `${error.message}`);
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
                Logger.log('ERROR', `${e.message}`);
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
                Logger.log('ERROR', `${e.message}`);
                response.success = false;
                response.message = e.message;
                resolve(response);
            }

            try {
                await this.mv();
            } catch (e) {
                Logger.log('ERROR', `${e.message}`);
                response.success = false;
                response.message = 'No valid files were in the archive.'
                resolve(response);
            }

            try {
                this.deleteDir(this.temp);
                this.deleteFile(this.file);
            } catch (e) {
                Logger.log('ERROR', `${e.message}`);
                response.success = false;
                response.message = 'No valid files were in the archive.'
                resolve(response);
            }

            response.success = true;
            response.message = 'Uploaded and Unpacked';
            resolve(response);

        });
    }

    private getFileType() {
        let filetype = path.extname(this.file);
        return filetype;
    }

    private async unarchive(): Promise<CommonHandlerResult> {
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

    private async unzip(): Promise<CommonHandlerResult> {
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
    
    private async scan_temp(): Promise<CommonHandlerResult> {
        return new Promise(async (resolve, reject) => {
            let files = await fsPromises.readdir(this.temp);
            for await (let file of files) {
                Logger.log(`INFO`, `File: ${file}`);
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
                            Logger.log(`DEBUG`, `${file} is an invalid name.`)
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

    private async checkForInvalidFileName(title: string): Promise<Boolean> {
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

    private async pageValidator(): Promise<CommonHandlerResult> {
        return new Promise( async (resolve, reject) => {
            for ( let i=0; i < this.tempdb.length; i++ ) {
                try {
                    if ( fs.statSync(this.tempdb[i].path).isDirectory() ) {
                        this.tempdb[i].pageCount = await this.getPageCount(this.tempdb[i].path); 
                    }
                } catch (e) {
                    Logger.log('ERROR', `${e.message}`);
                    reject(new Error(e.message));
                }

                if ( this.tempdb[i].pageCount == 0 ) { 
                    Logger.log(`DEBUG`, `${this.tempdb[i].path} has no valid pages.`)
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

    private getPageCount(manga_path: string): Promise<number> { //Counts how many pages in a temp manga dir.
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

    private async mv(): Promise<CommonHandlerResult> {
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

    private deleteDir(dir: string) {
        fs.rmdir(dir, (err) => {
            if (err) throw new Error(`Directory ${dir} could not be deleted: ${err}`);
        });
    }

    private deleteFile(file: string) {
        fs.unlink(file, (err) => {
            if (err) throw new Error(`File ${file} could not be deleted: ${err}`);
        })
    }

}