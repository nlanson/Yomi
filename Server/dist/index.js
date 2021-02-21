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
exports.UploadValidator = void 0;
const express_1 = __importDefault(require("express"));
const upload = require('express-fileupload');
const cors = require('cors');
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const unzipper = require('unzipper');
const app = express_1.default();
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
    constructor(dbpath) {
        this.dbpath = dbpath;
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            this.mangadb = yield this.scan_dir();
            yield this.init_db();
        });
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            this.mangadb = yield this.scan_dir();
            yield this.init_db();
            return true;
        });
    }
    //Scans for any directories that could contain manga in the Database Path.
    scan_dir() {
        console.log('Scanning...');
        return new Promise((resolve) => {
            var mangasList = [];
            fs_1.default.readdir(this.dbpath, (err, files) => {
                if (files == undefined) {
                    resolve(mangasList);
                }
                else {
                    files.forEach((file) => {
                        let fileDir = path_1.default.join(this.dbpath, file);
                        if (fs_1.default.statSync(fileDir).isDirectory()) { //If the file in this.dbpath is a directory, add to the mangas list.
                            mangasList.push({
                                title: file,
                                path: fileDir
                            });
                        }
                        else {
                            fs_1.default.unlink(fileDir, (err) => {
                                if (err)
                                    console.log(err);
                            });
                        }
                    });
                    console.log('DONE');
                    resolve(mangasList);
                }
            });
        });
    }
    //Initiales the DB from scanned dirs.
    init_db() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Creating DB');
            for (let i = 0; i < this.mangadb.length; i++) {
                this.mangadb[i].pageCount = this.getPageCount(this.mangadb[i].path); //Count how many files are in the path to fugure out how many pages are in the manga.
                if (this.mangadb[i].pageCount == 0) {
                    this.mangadb.splice(i, 1); //If there are no pages in the directory, remove it from the db.
                    fs_1.default.rmdirSync(this.mangadb[i].path, { recursive: true });
                    continue;
                }
                this.mangadb[i].pages = yield this.makePagesArray(this.mangadb[i].path); //Create an array of pages and their directories.
                this.mangadb[i].cover = this.addPreview(this.mangadb[i].pages); //Creates a cover property with the first page of the manga as the value.
            }
            console.log('DONE');
        });
    }
    addPreview(pages) {
        return pages[0];
    }
    getPageCount(abs_path) {
        //Need to ONLY return the count of files not folders.
        return fs_1.default.readdirSync(abs_path).length;
    }
    makePagesArray(abs_path) {
        return new Promise((resolve) => {
            var pages = [];
            fs_1.default.readdir(abs_path, (err, files) => {
                files = files.map(function (fileName) {
                    return {
                        name: fileName,
                        time: fs_1.default.statSync(abs_path + '/' + fileName).mtime.getTime()
                    };
                })
                    .sort(function (a, b) {
                    return a.time - b.time;
                })
                    .map(function (v) {
                    return v.name;
                });
                files.forEach((file) => {
                    //TODO: Only push jpg, png or jpeg file types as often manga downloaded contains ads in pdf or html format.
                    pages.push(abs_path + '/' + file);
                });
                resolve(pages);
            });
        });
    }
} //END DB Class
class Server {
    constructor(app, db) {
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
        this.listen();
    }
    listen() {
        this.app.listen(port, () => {
            console.log(`Yomi Server listening at http://localhost:${port}`);
        });
    }
    searchByTitle() {
        //Returns the Manga info such as title, path and page count as well as array of page paths.
        this.app.get('/manga/:title', (req, res) => {
            let search = req.params.title;
            console.log(`Searched requested for ${search}`);
            let found = false;
            let i = 0;
            while (i < this.db.mangadb.length && found == false) {
                if (this.db.mangadb[i].title == req.params.title) {
                    found = true;
                    res.status(200).send(this.db.mangadb[i]);
                }
                i++;
            }
            if (found == false)
                res.status(411).send({ message: 'Manga not found' });
        });
    }
    listdb() {
        // Can be used to list all manga in the DB to click and open.
        this.app.get('/list', (req, res) => {
            console.log('List requested.');
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
            console.log('Refresh requested.');
            let status = yield this.db.refresh();
            if (status == true) {
                res.status(200).send({ message: 'Refresed.' });
            }
        }));
    }
    editManga() {
        this.app.get('/editmanga/:edit', (req, res) => __awaiter(this, void 0, void 0, function* () {
            console.log('Edit Requested');
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
                            console.log(err);
                        }
                        else
                            console.log(`Successfully Edited ${ogName} -> ${newName}`);
                        this.db.refresh(); //Refresh DB
                        if (!message) {
                            message = 'Success';
                            res.status(200).send({ message: message }); // Full success
                        }
                        else {
                            res.status(510).send({ message: message }); //Partial success. Manga was valid but rename failed.
                        }
                    });
                }
                i++;
            }
            //If no match was found, then response with 'manga not found'
            if (found == false) {
                console.log('Edit is Invalid');
                message = 'Manga not found';
                let response = {
                    found: found,
                    message: message
                };
                res.status(411).send(response); //Respond with found = false and manga not found.
            }
        }));
    }
    upload() {
        this.app.get('/upload', (req, res) => {
            res.status(412)({ status: 'failed', message: `You've requested this the wrong way.` });
        });
        this.app.post('/upload', (req, res) => {
            if (req.files) {
                console.log('Recieving Upload...');
                let file = req.files.file;
                let filename = file.name;
                file.mv(this.db.dbpath + '/' + filename, (err) => __awaiter(this, void 0, void 0, function* () {
                    if (err) { //If move fails return error
                        res.status(510).send({ status: 'failed', message: 'Failed in file.mv()' });
                        console.log('Upload Failed at mv().');
                    }
                    else {
                        console.log('Upload Success');
                        //IF move is successful:
                        let filetype = path_1.default.extname(this.db.dbpath + '/' + filename); //Get file type
                        let valid = false;
                        if (filetype == '.zip') { //If file type is ZIP, the run the validateZIP function.
                            try {
                                valid = yield this.validateZip(filename);
                            }
                            catch (error) {
                                console.log(error);
                                valid = false;
                            }
                        }
                        if (valid == true) {
                            res.status(200).send({ message: 'Uploaded and Unpacked' });
                        }
                        else {
                            res.status(414).send({ message: 'Uploaded but Invalid' });
                        }
                    }
                }));
            }
            else {
                res.status(413).send({ message: 'Failed, no file uploaded.' });
            }
        });
    }
    validateZip(zipFile) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let temp = this.db.dbpath + '/temp/';
                const zip = yield fs_1.default.createReadStream(this.db.dbpath + '/' + zipFile) //Extract ZIP to /temp/ folder.
                    .pipe(unzipper.Extract({ path: temp }))
                    .on('close', () => __awaiter(this, void 0, void 0, function* () {
                    //When unzipping finishes, run the validator code on the temp direcetory.
                    let validator = new UploadValidator(temp, this.db, this.db.dbpath + '/' + zipFile);
                    let valid = yield validator.validate();
                    if (valid)
                        resolve(true);
                    else
                        resolve(false);
                }));
            }));
        });
    }
} //END Server Class
class UploadValidator {
    constructor(temp, real, zip) {
        this.temp = temp;
        this.real = real;
        this.zip = zip;
    }
    validate() {
        return __awaiter(this, void 0, void 0, function* () {
            let tempdb = yield this.scan_temp(); //Creates a temporary db to track files/dirs in the temp folder.
            for (let i = 0; i < tempdb.length; i++) {
                tempdb.pageCount = this.getPageCount(tempdb[i].path);
                if (tempdb.pageCount == 0) { //IF a directory in temp folder has no content, then remove it and delete it from the temp folder.
                    tempdb.splice(i, 1);
                    if (fs_1.default.statSync(tempdb[i].path).isDirectory()) {
                        fs_1.default.rmdirSync(tempdb[i].path, { recursive: true });
                    }
                    continue;
                }
            }
            let mvError = yield this.mv(tempdb); //move contents of temp directory into the live database.
            if (mvError) {
                //If the moves fails
                console.log('Failed at mv()');
                this.deleteZip();
                return false;
            }
            else {
                //If the move succeeds, delete the temp folder and zip.
                this.delelteTemp();
                this.deleteZip();
                return true;
            }
        });
    }
    scan_temp() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                var mangasList = [];
                fs_1.default.readdir(this.temp, (err, files) => {
                    if (files == undefined) {
                        console.log('files undefined in temp (340)');
                        resolve(mangasList);
                    }
                    else {
                        files.forEach((file) => {
                            let fileDir = path_1.default.join(this.temp, file);
                            if (fs_1.default.statSync(fileDir).isDirectory()) { //If the file in this.dbpath is a directory, add to the mangas list.
                                mangasList.push({
                                    title: file,
                                    path: fileDir
                                });
                            }
                            else {
                                fs_1.default.unlink(fileDir, (err) => {
                                    if (err)
                                        console.log(err);
                                });
                            }
                        });
                        resolve(mangasList);
                    }
                });
            });
        });
    }
    getPageCount(abs_path) {
        return fs_1.default.readdirSync(abs_path).length;
    }
    mv(tempdb) {
        return __awaiter(this, void 0, void 0, function* () {
            let error = false;
            if (tempdb.length == 0)
                return true;
            for (let i = 0; i < tempdb.length; i++) {
                fs_1.default.rename(tempdb[i].path, this.real.dbpath + '/' + tempdb[i].title, (err) => {
                    if (err)
                        console.log(err);
                    error = true;
                });
            }
            return error;
        });
    }
    delelteTemp() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Deleting temp...');
            fs_1.default.rmdir(this.temp, (err) => {
                if (err)
                    console.log(err);
            });
        });
    }
    deleteZip() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Deleting ZIP');
            fs_1.default.unlink(this.zip, (err) => {
                if (err)
                    console.log(err);
            });
        });
    }
}
exports.UploadValidator = UploadValidator;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let prodPath = '/data/manga';
        let devPath = 'C:/Users/Nlanson/Desktop/Coding/Yomi/test/data/manga';
        var dbpath = prodPath;
        var db = new Database(dbpath);
        yield db.setup();
        let server = new Server(app, db);
    });
}
main();
