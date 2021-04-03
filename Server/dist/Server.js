"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
//External
const express_1 = __importDefault(require("express"));
const app = express_1.default();
const fs_1 = __importDefault(require("fs"));
const fsPromises = fs_1.default.promises;
const upload = require('express-fileupload');
const cors = require('cors');
const Logger_1 = require("./Common/Logger");
//Config
const port = 6969; //Default port for the Yomi Server.
class Server {
    constructor(db, cdb) {
        this.app = app;
        this.db = db;
        this.cdb = cdb;
        this.init_server();
    }
    init_server() {
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
    listen() {
        this.app.listen(port, () => {
            Logger_1.Logger.log(`INFO`, `Yomi Server listening at http://localhost:${port}`);
        });
    }
    /*
        Start MangaDB API Endpoints
    */
    searchByTitle() {
        //Returns the Manga info
        //Req Params is a single string.
        this.app.get('/manga/:title', (req, res) => {
            let search = req.params.title;
            Logger_1.Logger.log('DEBUG', `Searched requested for ${search}`);
            let qdb = this.db.searchByTitle(search);
            if (qdb.success) {
                res.status(200).send(qdb.content);
            }
            else {
                res.status(404).send({ success: false, message: 'Manga not found' });
                Logger_1.Logger.log("ERROR", "Manga not found in search");
            }
        });
    }
    listdb() {
        // Can be used to list all manga in the DB to click and open.
        this.app.get('/list', (req, res) => {
            Logger_1.Logger.log(`DEBUG`, 'List requested');
            let list = this.db.list();
            res.status(200).send(list.content);
        });
    }
    refreshdb() {
        this.app.get('/refresh', (req, res) => __awaiter(this, void 0, void 0, function* () {
            Logger_1.Logger.log('DEBUG', 'Refresh requested');
            let status = yield this.db.refresh(); //re inits the db.
            if (status == true) {
                res.status(200).send({ success: true, message: 'Refresed.' });
            }
        }));
    }
    editManga() {
        return __awaiter(this, void 0, void 0, function* () {
            this.app.get('/editmanga/:edit', (req, res) => __awaiter(this, void 0, void 0, function* () {
                Logger_1.Logger.log(`DEBUG`, 'Edit requested');
                let edit = req.params.edit;
                let objectified = JSON.parse(edit);
                let ogName = objectified.title;
                let newName = objectified.edit;
                let qdb = yield this.db.editMangaName(ogName, newName);
                if (qdb.success) {
                    res.status(200).send({ success: qdb.success, message: qdb.message }); // Full success
                }
                else {
                    res.status(500).send({ success: qdb.success, message: qdb.message }); //Partial success. Manga was valid but rename failed.
                }
            }));
        });
    }
    upload() {
        return __awaiter(this, void 0, void 0, function* () {
            this.app.get('/upload', (req, res) => {
                res.status(405)({ status: 'failed', message: `You've requested this the wrong way.` });
            });
            this.app.post('/upload', (req, res) => __awaiter(this, void 0, void 0, function* () {
                if (req.files) {
                    Logger_1.Logger.log('DEBUG', 'Receiving upload');
                    let file = req.files.file;
                    let qdb = yield this.db.upload(file);
                    if (qdb.success) {
                        res.status(200).send({ success: qdb.success, message: qdb.message });
                    }
                    else {
                        res.status(500).send({ success: qdb.success, message: qdb.message });
                    }
                }
                else
                    res.status(400).send({ success: false, message: "No file received." });
            }));
        });
    }
    deleteManga() {
        return __awaiter(this, void 0, void 0, function* () {
            this.app.get('/deletemanga/:delete', (req, res) => __awaiter(this, void 0, void 0, function* () {
                Logger_1.Logger.log('DEBUG', 'Delete requested');
                let del = req.params.delete;
                let objectified = JSON.parse(del);
                del = objectified.title;
                let qdb = yield this.db.deleteManga(del);
                if (qdb.success) {
                    res.status(200).send({ success: true, message: `${del} was deleted.` });
                }
                else {
                    res.status(500).send({ success: false, message: 'Failed to delete. Check logs' });
                }
            }));
        });
    }
    /*
        Start CollectionEngine API Endpoints
    */
    newCollection() {
        this.app.get('/newcol/:colinfo', (req, res) => {
            Logger_1.Logger.log(`DEBUG`, 'New Collection Requested');
            let newCollectionInfo = req.params.colinfo;
            let objectified = JSON.parse(newCollectionInfo); //Convert newColInfo String into Object;
            let collectionName = objectified.name;
            let collectionContents = objectified.mangas;
            let result = this.cdb.newCollection(collectionName, collectionContents);
            if (result)
                res.status(200).send({ success: true, message: `New collection created.` });
            else
                res.status(500).send({ success: false, message: `Collection creation failed.` });
        });
    }
    listCollections() {
        this.app.get('/listcollections/', (req, res) => {
            Logger_1.Logger.log(`DEBUG`, 'List Collections Requested');
            let list = this.cdb.collectionList;
            res.status(200).send(list);
        });
    }
} //END Server Class
exports.Server = Server;
