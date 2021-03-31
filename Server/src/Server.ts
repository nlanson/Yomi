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
import { CollectionMangaData, dbapi_common_interface } from './Common/CommonInterfaces';

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
    
    private searchByTitle(): void { //Search the manga by title using api request /manga/{title}
                      //Returns the Manga info
        //Req Params is a single string.
        this.app.get('/manga/:title', (req: any, res: any) => {
            let search: string = req.params.title;
            Logger.log('DEBUG', `Searched requested for ${search}`);

            let qdb: dbapi_common_interface = this.db.searchByTitle(search);
            if ( qdb.success ) {
                res.status(200).send(qdb.content);
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
            let list: dbapi_common_interface = this.db.list();
            res.status(200).send(list.content);
        });
    }

    private refreshdb(): void { //Refreshes the DB
        this.app.get('/refresh', async (req: any, res: any) => {
            Logger.log('DEBUG', 'Refresh requested')
            let status: boolean = await this.db.refresh(); //re inits the db.

            if ( status == true ) {
                res.status(200).send({success: true, message: 'Refresed.'});
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

            let qdb: dbapi_common_interface = await this.db.editMangaName(ogName, newName);

            if ( qdb.success ) {
                res.status(200).send({success: qdb.success, message: qdb.message}); // Full success
            } else {
                res.status(500).send({success: qdb.success, message: qdb.message}); //Partial success. Manga was valid but rename failed.
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

    private async deleteManga(): Promise<void> {
        interface DeleteMangaReqParams {
            title: string
        }

        this.app.get('/deletemanga/:delete', async (req: Request, res: Response) => {
            Logger.log('DEBUG', 'Delete requested');
            let del: string = req.params.delete;
            let objectified: DeleteMangaReqParams = JSON.parse(del);
            del = objectified.title;

            let qdb: dbapi_common_interface = await this.db.deleteManga(del);

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
        
        this.app.get('/newcol/:colinfo', (req: any, res: any) => {
            Logger.log(`DEBUG`, 'New Collection Requested')
            let newCollectionInfo: string = req.params.colinfo;
            let objectified: NewColReqParams = JSON.parse(newCollectionInfo);
            let collectionName: string = objectified.name;
            let collectionContents: Array<CollectionMangaData> = objectified.mangas;

            let result: Boolean = this.cdb.newCollection(collectionName, collectionContents);
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