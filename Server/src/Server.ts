//External
import express, { Request, Response } from 'express';
const app = express();
import fs from 'fs';
const fsPromises = fs.promises;
const upload = require('express-fileupload');
const cors = require('cors');

//Internal
import { Database } from './Database';
import { Logger } from './Common/Logger';
import { CollectionEngine } from './Collections/CollectionEngine';
import { CollectionMangaData, CommonHandlerResult } from './Common/CommonInterfaces';

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
        this.deleteCollection();

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
    
    private searchByTitle(): void { //Search the manga by title using api request /manga/{title}
                      //Returns the Manga info
        //Req Params is a single string.
        this.app.get('/manga/:title', (req: any, res: any) => {
            let search: string = req.params.title;
            Logger.log('DEBUG', `Info for ${search} requested`);

            let qdb: CommonHandlerResult = this.db.searchByTitle(search);
            if ( qdb.status == 'success' ) {
                res.status(200).send(qdb);
            } else {
                res.status(400).send(qdb);
                Logger.log("ERROR", "Manga not found in search");
            }
        });
    }

    //NO JSEND STANDARD
    private listdb(): void { //List the DB to api request /list.
               // Can be used to list all manga in the DB to click and open.
        this.app.get('/list', (req: any, res: any) => {
            Logger.log(`DEBUG`, 'List requested')
            let list: CommonHandlerResult = this.db.list();
            res.status(200).send(list.data);
        });
    }

    private refreshdb(): void { //Refreshes the DB
        this.app.get('/refresh', async (req: any, res: any) => {
            Logger.log('DEBUG', 'Refresh requested')
            let status: boolean = await this.db.refresh(); //re inits the db.

            if ( status ) {
                res.status(200).send({status: 'success', message: 'Refreshed!'});
            } else {
                res.status(500).send({status: 'error', message: 'Refresh failed.'});
            }
        })
    }

    private async editManga(): Promise<void> {
        interface EditMangaReqParams {
            title: string, //OldName
            edit: string //New Name
        }

        this.app.get('/editmanga/:edit', async (req: any, res: any) => {
            Logger.log(`DEBUG`, 'Edit requested')
            let edit: string = req.params.edit;
            let objectified: EditMangaReqParams = JSON.parse(edit);
            let ogName: string = objectified.title; //Original name of the manga
            let newName = objectified.edit; //New name of the manga

            let qdb: CommonHandlerResult = await this.db.editMangaName(ogName, newName);

            if ( qdb.status == 'success' ) {
                this.cdb.updateMangaNameForEachEntry(ogName, newName); //Updates the edited manga in every collection.
                res.status(200).send(qdb); // Full success
            } else {
                res.status(500).send(qdb); //Partial success. Manga was valid but rename failed.
            }
        });
    }

    private async upload(): Promise<void> {
        this.app.get('/upload', (req: any, res: any) => {
            res.status(400)({status: 'failed', message: `You've requested this the wrong way.`})
        })
        
        this.app.post('/upload', async (req: any, res: any) => {
            if ( req.files ) {
                Logger.log('DEBUG', 'Receiving upload')
                let file = req.files.file;

                let qdb: CommonHandlerResult = await this.db.upload(file);
                if ( qdb.status == 'success' ) {
                    Logger.log(`DEBUG`, `Upload Successful!`);
                    res.status(200).send(qdb);
                } else {
                    Logger.log(`ERROR`, `Upload Failed: ${qdb.message}`);
                    res.status(500).send(qdb);
                }
            } else res.status(400).send({status: 'error', message: "No file received."});
        });
    }

    private async deleteManga(): Promise<void> {
        interface DeleteMangaReqParams {
            title: string
        }

        this.app.get('/deletemanga/:delete', async (req: Request, res: Response) => {
            Logger.log('DEBUG', 'Delete requested');
            let del: string = req.params.delete;
            let objectified: DeleteMangaReqParams = JSON.parse(del);
            del = objectified.title;

            let qdb: CommonHandlerResult = await this.db.deleteManga(del);

            if ( qdb.status == 'success' ) {
                await this.db.refresh(); //DB is refreshed here becase if I try and refresh from application side it doesnt work for some reason.
                res.status(200).send({status: 'success', message: `${del} was deleted.`});
            } else {
                res.status(500).send({status: 'failure', message: 'Failed to delete. Check logs'});
            }
        });
    }

    /*
        Start CollectionEngine API Endpoints
    */

    private newCollection(): void {
        interface NewColReqParams {
            name: string,
            mangas: Array<CollectionMangaData>
        }
        
        this.app.get('/collections/new/:colinfo', (req: any, res: any) => {
            Logger.log(`DEBUG`, 'New Collection Requested')
            let newCollectionInfo: string = req.params.colinfo;
            let objectified: NewColReqParams = JSON.parse(newCollectionInfo); //Convert newColInfo String into Object;

            let collectionName: string = objectified.name;
            let collectionContents: Array<CollectionMangaData> = objectified.mangas;
            
            if (collectionContents.length == 0) {
                res.status(400).send({success: false, message: 'No mangas selected'});
                return;
            }

            let result: CommonHandlerResult = this.cdb.newCollection(collectionName, collectionContents);
            if ( result.status == 'success' ) res.status(200).send(result); //Success
            else {// On collection creation error
                //Send back with content
                if (result.data) res.status(500).send(result);
                //Send back without content
                else res.status(500).send(result);
            }
        });
    }

    //NO JSEND STANDARD
    private listCollections() {
        this.app.get('/collections/list', (req: any, res: any) => {
            Logger.log(`DEBUG`, 'List Collections Requested');

            let list = this.cdb.collectionList;

            res.status(200).send(list);
        });
    }

    private deleteCollection() {
        this.app.get('/collections/delete/:id', (req: any, res: any) => {
            Logger.log(`DEBUG`, 'Delete collection requested.');
            let id:string = req.params.id

            let result: CommonHandlerResult = this.cdb.delete(id);
            if (result.status == 'success')
                res.status(200).send(result);
            else
                res.status(400).send(result);
        });
    }

}//END Server Class