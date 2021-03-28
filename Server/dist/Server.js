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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
const UploadHandler_1 = require("./UploadHandler");
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
        //Returns the Manga info such as title, path and page count as well as array of page paths.
        this.app.get('/manga/:title', (req, res) => {
            let search = req.params.title;
            Logger_1.Logger.log('DEBUG', `Searched requested for ${search}`);
            let found = false;
            let i = 0;
            while (i < this.db.mangadb.length && found == false) {
                if (this.db.mangadb[i].title == req.params.title) {
                    found = true;
                    res.status(200).send(this.db.mangadb[i]);
                }
                i++;
            }
            if (found == false) {
                res.status(404).send({ success: false, message: 'Manga not found' });
                Logger_1.Logger.log("ERROR", "Manga not found in search");
            }
        });
    }
    listdb() {
        // Can be used to list all manga in the DB to click and open.
        this.app.get('/list', (req, res) => {
            Logger_1.Logger.log(`DEBUG`, 'List requested');
            let list = [];
            for (let manga in this.db.mangadb) {
                const listEntry = ((_a) => {
                    var { pages } = _a, manga = __rest(_a, ["pages"]);
                    return manga;
                })(this.db.mangadb[manga]); // Remove pages property from mangadb entries and push into list.
                list.push(listEntry);
            }
            res.status(200).send(list);
        });
    }
    refreshdb() {
        this.app.get('/refresh', (req, res) => __awaiter(this, void 0, void 0, function* () {
            Logger_1.Logger.log('DEBUG', 'Refresh requested');
            let status = yield this.db.refresh();
            if (status == true) {
                res.status(200).send({ success: true, message: 'Refresed.' });
            }
        }));
    }
    editManga() {
        this.app.get('/editmanga/:edit', (req, res) => __awaiter(this, void 0, void 0, function* () {
            Logger_1.Logger.log(`DEBUG`, 'Edit requested');
            let edit = req.params.edit;
            edit = JSON.parse(edit);
            let ogName = edit.title;
            let newName = edit.edit;
            let i = 0;
            let found = false;
            let message;
            while (i < this.db.mangadb.length && found == false) { //Loop through every manga
                if (this.db.mangadb[i].title == ogName) { //If ogname equals any manga in the db then..,
                    found = true;
                    this.db.mangadb[i].title = newName; //Set manga title to the new name
                    fs_1.default.rename(this.db.mangadb[i].path, this.db.dbpath + '/' + newName, (err) => {
                        if (err) {
                            message = err;
                            Logger_1.Logger.log('ERROR', `${err.message}`);
                        }
                        else
                            Logger_1.Logger.log(`DEBUG`, `Successfully Edited ${ogName} -> ${newName}`);
                        this.db.refresh(); //Refresh DB
                        if (!message) {
                            message = 'Success';
                            res.status(200).send({ success: true, message: message }); // Full success
                        }
                        else {
                            res.status(500).send({ success: false, message: message }); //Partial success. Manga was valid but rename failed.
                            Logger_1.Logger.log(`ERROR`, 'Edit partially successful. Manga was found but rename failed.');
                        }
                    });
                }
                i++;
            }
            //If no match was found, then response with 'manga not found'
            if (found == false) {
                Logger_1.Logger.log(`ERROR`, 'Edit request manga not found.');
                message = 'Manga not found';
                let response = {
                    success: found,
                    message: message
                };
                res.status(404).send(response); //Respond with found = false and manga not found.
                Logger_1.Logger.log(`ERROR`, 'Manga to edit not found.');
            }
        }));
    }
    upload() {
        this.app.get('/upload', (req, res) => {
            res.status(405)({ status: 'failed', message: `You've requested this the wrong way.` });
        });
        this.app.post('/upload', (req, res) => {
            if (req.files) {
                Logger_1.Logger.log('DEBUG', 'Receiving upload');
                let file = req.files.file;
                let filename = file.name;
                file.mv(this.db.dbpath + '/' + filename, (err) => __awaiter(this, void 0, void 0, function* () {
                    if (err) { //If move fails return error
                        res.status(510).send({ success: false, message: 'Failed recieving the file properly.' });
                        Logger_1.Logger.log(`ERROR`, 'Failed receiving the file upload.');
                    }
                    else {
                        Logger_1.Logger.log('DEBUG', 'Upload received, handling...');
                        //IF move is successful:
                        let archive = this.db.dbpath + '/' + filename;
                        let uh = new UploadHandler_1.UploadHandler(archive, this.db);
                        let result = yield uh.handle();
                        switch (result.success) {
                            case (true):
                                res.status(200).send(result);
                                break;
                            case (false):
                                res.status(200).send(result);
                                break;
                            default:
                                res.status(500).send({ success: false, message: 'Handler failed to run.' });
                                Logger_1.Logger.log('ERROR', 'Handler failed to initialise.');
                        }
                    }
                }));
            }
            else {
                res.status(406).send({ success: false, message: 'Failed, no file uploaded.' });
                Logger_1.Logger.log('ERROR', 'No file uploaded.');
            }
        });
    }
    deleteManga() {
        return __awaiter(this, void 0, void 0, function* () {
            this.app.get('/deletemanga/:delete', (req, res) => __awaiter(this, void 0, void 0, function* () {
                Logger_1.Logger.log('DEBUG', 'Delete requested');
                let del = req.params.delete;
                del = JSON.parse(del);
                del = del.title;
                yield fsPromises.rmdir(this.db.dbpath + '/' + del, { recursive: true });
                res.status(200).send({ success: true, message: `${del} was deleted.` });
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
            newCollectionInfo = JSON.parse(newCollectionInfo);
            let collectionName = newCollectionInfo.name;
            let collectionContents = newCollectionInfo.mangas;
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
