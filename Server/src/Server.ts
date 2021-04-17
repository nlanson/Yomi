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
            if ( qdb.success ) {
                res.status(200).send({success: true, message: 'Manga was found', content: qdb.content});
            } else {
                res.status(404).send({success: false, message: 'Manga not found'});
                Logger.log("ERROR", "Manga not found in search");
            }
        });
    }

    private listdb(): void { //List the DB to api request /list.
               // Can be used to list all manga in the DB to click and open.
        this.app.get('/list', (req: any, res: any) => {
            Logger.log(`DEBUG`, 'List requested')
            let list: CommonHandlerResult = this.db.list();
            res.status(200).send(list.content);
        });
    }

    private refreshdb(): void { //Refreshes the DB
        this.app.get('/refresh', async (req: any, res: any) => {
            Logger.log('DEBUG', 'Refresh requested')
            let status: boolean = await this.db.refresh(); //re inits the db.

            if ( status ) {
                res.status(200).send({success: true, message: 'Refreshed!'});
            } else {
                res.status(500).send({success: false, message: 'Refresh failed.'});
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
            let ogName: string = objectified.title;
            let newName = objectified.edit;

            let qdb: CommonHandlerResult = await this.db.editMangaName(ogName, newName);

            if ( qdb.success ) {
                res.status(200).send({success: qdb.success, message: qdb.message}); // Full success
            } else {
                res.status(500).send({success: qdb.success, message: qdb.message}); //Partial success. Manga was valid but rename failed.
            }
        });
    }

    private async upload(): Promise<void> {
        this.app.get('/upload', (req: any, res: any) => {
            res.status(405)({status: 'failed', message: `You've requested this the wrong way.`})
        })
        
        this.app.post('/upload', async (req: any, res: any) => {
            if ( req.files ) {
                Logger.log('DEBUG', 'Receiving upload')
                let file = req.files.file;

                let qdb: CommonHandlerResult = await this.db.upload(file);
                if ( qdb.success ) {
                    Logger.log(`DEBUG`, `Upload Successful!`);
                    res.status(200).send({success: qdb.success, message: qdb.message});
                } else {
                    Logger.log(`ERROR`, `Upload Failed: ${qdb.message}`);
                    res.status(500).send({success: qdb.success, message: qdb.message});
                }
            } else res.status(400).send({success: false, message: "No file received."});
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

            if ( qdb.success ) {
                res.status(200).send({success: true, message: `${del} was deleted.`});
            } else {
                res.status(500).send({success: false, message: 'Failed to delete. Check logs'});
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
                res.status(406).send({success: false, message: 'No mangas selected'});
                return;
            }

            let result: CommonHandlerResult = this.cdb.newCollection(collectionName, collectionContents);
            if ( result.success ) res.status(200).send(result); //Success
            else {// On collection creation error
                //Send back with content
                if (result.content) res.status(500).send({success: result.success, message: result.message, content: result.content});
                //Send back without content
                else res.status(500).send({success: result.success, message: result.message});
            }
        });
    }

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
            if (result.success)
                res.status(200).send(result);
            else
                res.status(406).send(result);
        });
    }

}//END Server Class