import fs from 'fs';
const fsPromises = fs.promises;
import path from 'path';
const unzipper = require('unzipper');

export class Database {
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