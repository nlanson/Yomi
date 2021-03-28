//External
import express, { Request, Response } from 'express';
const app = express();
import fs from 'fs';
const fsPromises = fs.promises;
const upload = require('express-fileupload');
const cors = require('cors');

//Internal
import { Database } from './Database';
import { UploadHandler } from './UploadHandler'
import { Logger } from './Common/Logger';
import { CollectionEngine } from './Collections/CollectionEngine';
import { CollectionMangaData } from './Common/Interfaces';

//Config
const port = 6969; //Default port for the Yomi Server.


export class Server {
    private app: any;
    private db: Database;
    private cdb: CollectionEngine;

    constructor( db: Database, cdb: CollectionEngine ) {
        this.app = app;
        this.db = db;
        this.cdb = cdb;

        this.init_server();
        
    }
    
    private init_server() {
        //Express Middleware
        this.app.use(upload());
        this.app.use(cors());
        
        //Could possibly seperate MangaDBAPI and ColDBAPI into seperate classes for organisation.
        
        //MangaDB API
        this.refreshdb();
        this.searchByTitle();
        this.listdb();
        this.editManga();
        this.upload();
        this.deleteManga();

        //CollectionDB API
        this.newCollection();
        this.listCollections();

        //Start listening on port
        this.listen();
    }
    
    private listen() { //Starts API
        this.app.listen(port, () => {
            Logger.log(`INFO`, `Yomi Server listening at http://localhost:${port}`);
        });
    }

    /*
        Start MangaDB API Endpoints
    */
    
    private searchByTitle() { //Search the manga by title using api request /manga/{title}
                      //Returns the Manga info such as title, path and page count as well as array of page paths.
        this.app.get('/manga/:title', (req: any, res: any) => {
            let search = req.params.title;
            Logger.log('DEBUG', `Searched requested for ${search}`)
            
            let found: boolean = false;
            let i:number = 0;
            while ( i < this.db.mangadb.length && found == false ) {
                if ( this.db.mangadb[i].title == req.params.title ) {
                    found = true;
                    res.status(200).send(this.db.mangadb[i]);
                }
                i++
            }

            if ( found == false ) {
                res.status(404).send({success: false, message: 'Manga not found'});
                Logger.log("ERROR", "Manga not found in search");
            }
        });
    }

    private listdb() { //List the DB to api request /list.
               // Can be used to list all manga in the DB to click and open.
        this.app.get('/list', (req: any, res: any) => {
            Logger.log(`DEBUG`, 'List requested')
            let list = [];
            for (let manga in this.db.mangadb) {
                const listEntry = (({ pages, ...manga }) => manga)(this.db.mangadb[manga]) // Remove pages property from mangadb entries and push into list.
                list.push(listEntry);
            }
            
            res.status(200).send(list);
        });
    }

    private refreshdb() { //Refreshes the DB
        this.app.get('/refresh', async (req: any, res: any) => {
            Logger.log('DEBUG', 'Refresh requested')
            let status = await this.db.refresh();

            if ( status == true ) {
                res.status(200).send({success: true, message: 'Refresed.'});
            }
        })
    }

    private editManga() {
        this.app.get('/editmanga/:edit', async (req: any, res: any) => {
            Logger.log(`DEBUG`, 'Edit requested')
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
                        if (err) { message = err;  Logger.log('ERROR', `${err.message}`); }
                        else Logger.log(`DEBUG`, `Successfully Edited ${ogName} -> ${newName}`);
                        this.db.refresh(); //Refresh DB
                        
                        if (!message) { 
                            message = 'Success';
                            res.status(200).send({success: true, message: message}); // Full success
                        } else{
                            res.status(500).send({success: false, message: message}); //Partial success. Manga was valid but rename failed.
                            Logger.log(`ERROR`, 'Edit partially successful. Manga was found but rename failed.');
                        }
                        
                    });
                }
                i++;
            }

            //If no match was found, then response with 'manga not found'
            if ( found == false ) {
                Logger.log(`ERROR`, 'Edit request manga not found.')
                message = 'Manga not found';
                let response = {
                    success: found,
                    message: message
                }
                res.status(404).send(response); //Respond with found = false and manga not found.
                Logger.log(`ERROR`, 'Manga to edit not found.');
            }
        });
    }

    private upload() {
        this.app.get('/upload', (req: any, res: any) => {
            res.status(405)({status: 'failed', message: `You've requested this the wrong way.`})
        })
        
        this.app.post('/upload', (req: any, res: any) => {
            if ( req.files ) {
                Logger.log('DEBUG', 'Receiving upload')
                let file = req.files.file;
                let filename = file.name;

                file.mv(this.db.dbpath + '/' + filename, async (err: any) => { //Move received upload to dbpath/upload.zip
                    if(err) { //If move fails return error
                        res.status(510).send({success: false, message: 'Failed recieving the file properly.'});
                        Logger.log(`ERROR`, 'Failed receiving the file upload.');
                    }
                    else { 
                        Logger.log('DEBUG', 'Upload received, handling...')

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
                                Logger.log('ERROR', 'Handler failed to initialise.');
                        }
                    }
                })
            } else {
                res.status(406).send({success: false, message: 'Failed, no file uploaded.'});
                Logger.log('ERROR', 'No file uploaded.');
            }
        });
    }

    private async deleteManga() {
        this.app.get('/deletemanga/:delete', async (req: Request, res: Response) => {
            Logger.log('DEBUG', 'Delete requested');
            let del: any = req.params.delete;
            del = JSON.parse(del);
            del = del.title;

            await fsPromises.rmdir(this.db.dbpath + '/' + del, { recursive: true });

            res.status(200).send({success: true, message: `${del} was deleted.`});
        });
    }

    /*
        Start CollectionEngine API Endpoints
    */

    private newCollection() {
        this.app.get('/newcol/:colinfo', (req: any, res: any) => {
            Logger.log(`DEBUG`, 'New Collection Requested')
            let newCollectionInfo = req.params.colinfo;
            newCollectionInfo = JSON.parse(newCollectionInfo);
            let collectionName: string = newCollectionInfo.name;
            let collectionContents: Array<CollectionMangaData> = newCollectionInfo.mangas;

            let result = this.cdb.newCollection(collectionName, collectionContents);
            if ( result ) res.status(200).send({success: true, message: `New collection created.`});
            else res.status(500).send({success: false, message: `Collection creation failed.`});
        });
    }

    private listCollections() {
        this.app.get('/listcollections/', (req: any, res: any) => {
            Logger.log(`DEBUG`, 'List Collections Requested');

            let list = this.cdb.collectionList;

            res.status(200).send(list);
        });
    }

}//END Server Class