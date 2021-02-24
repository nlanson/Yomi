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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
const fsPromises = fs_1.default.promises;
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
                            console.log(`Deleting ${file} as it is not a directory.`);
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
                this.mangadb[i].pageCount = yield this.getPageCount(this.mangadb[i].path); //Count how many files are in the path to fugure out how many pages are in the manga.
                if (this.mangadb[i].pageCount == 0) {
                    console.log(`Deleting ${this.mangadb[i].title} as it has a page count of zero.`);
                    fs_1.default.rmdirSync(this.mangadb[i].path, { recursive: true });
                    this.mangadb.splice(i, 1); //If there are no pages in the directory, remove it from the db.
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
        return new Promise((resolve) => {
            var pages = [];
            fs_1.default.readdir(abs_path, (err, files) => {
                files.forEach((file) => {
                    let filetype = path_1.default.extname(abs_path + '/' + file);
                    //console.log(`${file} is a ${filetype}`);
                    if ( //List all accepted page types here.
                    filetype == '.jpg' ||
                        filetype == '.JPG' ||
                        filetype == '.png' ||
                        filetype == '.PNG' ||
                        filetype == '.jpeg' ||
                        filetype == '.JPEG') {
                        pages.push(abs_path + '/' + file);
                    }
                });
                resolve(pages.length);
            });
        });
    }
    makePagesArray(abs_path) {
        return new Promise((resolve) => {
            var pages = [];
            fs_1.default.readdir(abs_path, (err, files) => {
                //Sort pages by time
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
                    let filetype = path_1.default.extname(abs_path + '/' + file);
                    if ( //List all accepted page types here.
                    filetype == '.jpg' ||
                        filetype == '.JPG' ||
                        filetype == '.png' ||
                        filetype == '.PNG' ||
                        filetype == '.jpeg' ||
                        filetype == '.JPEG') {
                        pages.push(abs_path + '/' + file);
                    }
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
        this.upload(); //REPLACED WITH uploadv2();
        this.uploadv2();
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
                res.status(404).send({ message: 'Manga not found' });
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
                            res.status(500).send({ message: message }); //Partial success. Manga was valid but rename failed.
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
                res.status(404).send(response); //Respond with found = false and manga not found.
            }
        }));
    }
    //REPLACED WITH uploadv2();
    upload() {
        this.app.get('/upload', (req, res) => {
            res.status(405)({ status: 'failed', message: `You've requested this the wrong way.` });
        });
        this.app.post('/upload', (req, res) => {
            if (req.files) {
                console.log('Recieving Upload...');
                let file = req.files.file;
                let filename = file.name;
                file.mv(this.db.dbpath + '/' + filename, (err) => __awaiter(this, void 0, void 0, function* () {
                    if (err) { //If move fails return error
                        res.status(500).send({ status: 'failed', message: 'Failed in file.mv()' });
                        console.log('Upload Failed at mv().');
                    }
                    else {
                        console.log('Upload Success');
                        //IF move is successful:
                        let filetype = path_1.default.extname(this.db.dbpath + '/' + filename); //Get file type
                        let valid = { valid: false, message: 'You should not ever see this in the app. If you do contact developer.' };
                        if (filetype == '.zip') { //If file type is ZIP, the run the validateZIP function.
                            try {
                                valid = yield this.validateZip(filename);
                            }
                            catch (error) {
                                console.log(error);
                                valid = { valid: false, message: error };
                            }
                        }
                        else { //If the file is not a zip reject. Can also add support for other file types here if needed.
                            valid = { valid: false, message: `${filetype} is not supported. Please try using .zip` };
                        }
                        if (valid.valid == true) {
                            res.status(200).send({ success: valid.valid, message: valid.message });
                        }
                        else if (valid.valid == false) {
                            res.status(406).send({ success: valid.valid, message: valid.message });
                        }
                        else { //If valid is undefined for some reason.
                            res.status(500).send({ success: false, message: 'Validator null' });
                        }
                    }
                }));
            }
            else {
                res.status(413).send({ message: 'Failed, no file uploaded.' });
            }
        });
    }
    uploadv2() {
        this.app.get('/uploadv2', (req, res) => {
            res.status(405)({ status: 'failed', message: `You've requested this the wrong way.` });
        });
        this.app.post('/uploadv2', (req, res) => {
            if (req.files) {
                console.log('Recieving Upload...');
                let file = req.files.file;
                let filename = file.name;
                file.mv(this.db.dbpath + '/' + filename, (err) => __awaiter(this, void 0, void 0, function* () {
                    if (err) { //If move fails return error
                        res.status(510).send({ status: 'failed', message: 'Failed recieving the file properly.' });
                        console.log('Upload Failed at mv().');
                    }
                    else {
                        console.log('Upload Success');
                        //IF move is successful:
                        let archive = this.db.dbpath + '/' + filename;
                        let uh = new UploadHandler(archive, this.db);
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
                        }
                    }
                }));
            }
            else {
                res.status(406).send({ message: 'Failed, no file uploaded.' });
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
                    if (valid.valid)
                        resolve(valid);
                    else
                        resolve(valid);
                }));
            }));
        });
    }
} //END Server Class
//Validates Uploaded files. 
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
                tempdb.pageCount = yield this.getPageCount(tempdb[i].path);
                if (tempdb.pageCount == 0) {
                    console.log(`${tempdb[i].path} is invalid`);
                    tempdb.splice(i, 1);
                    if (fs_1.default.statSync(tempdb[i].path).isDirectory()) {
                        fs_1.default.rmdirSync(tempdb[i].path, { recursive: true });
                    }
                    continue;
                }
            }
            if (tempdb.length == 0)
                return { valid: false, message: 'No valid files were detected.' };
            let mvError = yield this.mv(tempdb); //move contents of temp directory into the live database.
            if (mvError) {
                //If the moves fails
                console.log('Failed at mv()');
                this.deleteZip();
                return { valid: false, message: 'File move failed @UploadValidator.mv().' };
            }
            else {
                //If the move succeeds, delete the temp folder and zip.
                this.delelteTemp();
                this.deleteZip();
                return { valid: true, message: 'Success!' };
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
                        let dupe_UI = 1;
                        files.forEach((file) => {
                            let fileDir = path_1.default.join(this.temp, file);
                            if (fs_1.default.statSync(fileDir).isDirectory()) { //If the file in this.dbpath is a directory, do the dupe detection.  
                                //Dupe Detection Loop. Checks if there are any dupes in the real db.
                                let inval = false;
                                do {
                                    if (!this.checkForInvalidFileName(file)) {
                                        inval = false;
                                        mangasList.push({
                                            title: file,
                                            path: fileDir
                                        });
                                    }
                                    else {
                                        inval = true;
                                        console.log(`${file} is an invalid name.`);
                                        file = file + `(${dupe_UI.toString()})`;
                                        dupe_UI++;
                                    }
                                } while (inval == true);
                            }
                            else { // If the file is not a directory purge it,
                                fs_1.default.unlink(fileDir, (err) => {
                                    if (err)
                                        console.log(err);
                                });
                            }
                        });
                        //Return the mangas list. (Shouldnt have any dupes)
                        resolve(mangasList);
                    }
                });
            });
        });
    }
    getPageCount(abs_path) {
        return new Promise((resolve) => {
            var pages = [];
            fs_1.default.readdir(abs_path, (err, files) => {
                files.forEach((file) => {
                    let filetype = path_1.default.extname(abs_path + '/' + file);
                    if (filetype == '.jpg' ||
                        filetype == '.JPG' ||
                        filetype == '.png' ||
                        filetype == '.PNG' ||
                        filetype == '.jpeg' ||
                        filetype == '.JPEG') {
                        pages.push(abs_path + '/' + file);
                    }
                });
                resolve(pages.length);
            });
        });
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
    checkForInvalidFileName(title) {
        let i = 0;
        let found = false;
        while (i < this.real.mangadb.length && found == false) {
            if ((this.real.mangadb[i].title == title) || (title == 'temp')) {
                found = true;
            }
            i++;
        }
        return found;
    }
}
exports.UploadValidator = UploadValidator;
class UploadHandler {
    constructor(file, db) {
        this.tempdb = [];
        this.file = file;
        this.db = db;
        this.temp = this.db.dbpath + '/temp/';
        this.filetype = this.getFileType();
    }
    //Method to call.
    handle() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[DEBUG] handler() entered`);
            let response = { success: false, message: 'unhandled.' };
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.unarchive();
                }
                catch (error) {
                    console.log(error.message);
                    response.success = false;
                    response.message = error.message;
                    resolve(response);
                }
                try {
                    yield this.scan_temp();
                    if (this.tempdb.length == 0) {
                        response.success = false;
                        response.message = 'No valid files were in the archive.';
                        resolve(response);
                    }
                }
                catch (e) {
                    console.log(e.message);
                    response.success = false;
                    response.message = e.message;
                    resolve(response);
                }
                try {
                    yield this.pageValidator();
                    if (this.tempdb.length == 0) {
                        response.success = false;
                        response.message = 'No valid files were in the archive.';
                        resolve(response);
                    }
                }
                catch (e) {
                    console.log(e.message);
                    response.success = false;
                    response.message = e.message;
                    resolve(response);
                }
                try {
                    yield this.mv();
                }
                catch (e) {
                    console.log(e.message);
                    response.success = false;
                    response.message = 'No valid files were in the archive.';
                    resolve(response);
                }
                try {
                    this.deleteDir(this.temp);
                    this.deleteFile(this.file);
                }
                catch (e) {
                    console.log(e.message);
                    response.success = false;
                    response.message = 'No valid files were in the archive.';
                    resolve(response);
                }
                response.success = true;
                response.message = 'Uploaded and Unpacked';
                resolve(response);
            }));
        });
    }
    getFileType() {
        let filetype = path_1.default.extname(this.file);
        return filetype;
    }
    unarchive() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[DEBUG] unarchive() entered`);
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let result = { success: false, message: 'unarchiver failure' };
                switch (this.filetype) {
                    case ('.zip'):
                        result = yield this.unzip();
                        resolve(result);
                        break;
                    default:
                        reject(new Error(`Unsupported file type "${this.filetype}"`));
                }
            }));
        });
    }
    unzip() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[DEBUG] unzip() entered`);
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const zip = yield fs_1.default.createReadStream(this.file) //Extract ZIP to /temp/ folder.
                    .pipe(unzipper.Extract({ path: this.temp }))
                    .on('close', () => __awaiter(this, void 0, void 0, function* () {
                    let result = { success: true, message: 'Unzipped.' };
                    resolve(result);
                }))
                    .on('error', () => __awaiter(this, void 0, void 0, function* () {
                    reject(new Error('Unzipping read stream gave an error.'));
                }));
            }));
        });
    }
    scan_temp() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[DEBUG] scantemp() entered`);
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var e_1, _a;
                let files = yield fsPromises.readdir(this.temp);
                try {
                    for (var files_1 = __asyncValues(files), files_1_1; files_1_1 = yield files_1.next(), !files_1_1.done;) {
                        let file = files_1_1.value;
                        console.log(file);
                        let fileDir = path_1.default.join(this.temp, file);
                        //If the file in this.dbpath is a directory, do the dupe detection.  
                        if (fs_1.default.statSync(fileDir).isDirectory()) {
                            //Dupe Detection Loop. Checks if there are any dupes in the real db.
                            let inval = false;
                            let dupe_UI = 1;
                            do {
                                let check = yield this.checkForInvalidFileName(file);
                                if (!check) {
                                    //If the directory is not a duplicate, add it to the tempdb.
                                    inval = false;
                                    this.tempdb.push({
                                        title: file,
                                        path: fileDir
                                    });
                                }
                                else {
                                    //If the directory is a dupe, tag it with the dupe_UI and reloop.
                                    inval = true;
                                    console.log(`${file} is an invalid name.`);
                                    file = file + `(${dupe_UI.toString()})`;
                                    dupe_UI++;
                                }
                            } while (inval == true);
                        }
                        else {
                            // If the file is not a directory purge it,
                            fs_1.default.unlink(fileDir, (err) => {
                                if (err)
                                    reject(new Error(`fs.unlink() gave an error while deleting ${file}`));
                            });
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (files_1_1 && !files_1_1.done && (_a = files_1.return)) yield _a.call(files_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                resolve({ success: true, message: 'Temp scanned' });
            }));
        });
    }
    checkForInvalidFileName(title) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[DEBUG] checkForInvalidFileName() entered. Checking for ${title}`);
            return new Promise((resolve, reject) => {
                let i = 0;
                let found = false;
                while (i < this.db.mangadb.length && found == false) {
                    if ((this.db.mangadb[i].title == title) || (title == 'temp')) {
                        found = true;
                    }
                    i++;
                }
                resolve(found);
            });
        });
    }
    pageValidator() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[DEBUG] pageValidator() entered`);
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                for (let i = 0; i < this.tempdb.length; i++) {
                    try {
                        if (fs_1.default.statSync(this.tempdb[i].path).isDirectory()) {
                            this.tempdb[i].pageCount = yield this.getPageCount(this.tempdb[i].path);
                        }
                    }
                    catch (e) {
                        console.log(e.message);
                        reject(new Error(e.message));
                    }
                    if (this.tempdb[i].pageCount == 0) {
                        console.log(`${this.tempdb[i].path} has no valid pages.`);
                        if (fs_1.default.statSync(this.tempdb[i].path).isDirectory()) {
                            fs_1.default.rmdirSync(this.tempdb[i].path, { recursive: true });
                        }
                        this.tempdb.splice(i, 1);
                        continue;
                    }
                }
                let response = { success: true, message: 'Pages Validated' };
                resolve(response);
            }));
        });
    }
    getPageCount(manga_path) {
        console.log(`[DEBUG] getPageCount() entered`);
        return new Promise((resolve, reject) => {
            var pages = 0;
            fs_1.default.readdir(manga_path, (err, files) => {
                if (err)
                    reject(new Error('fs.readdir() threw an error whilst counting pages.'));
                files.forEach((file) => {
                    let filetype = path_1.default.extname(this.temp + '/' + file);
                    if (filetype == '.jpg' ||
                        filetype == '.JPG' ||
                        filetype == '.png' ||
                        filetype == '.PNG' ||
                        filetype == '.jpeg' ||
                        filetype == '.JPEG') {
                        pages++;
                    }
                });
                resolve(pages);
            });
        });
    }
    mv() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[DEBUG] mv() entered ${this.tempdb.length}`);
            return new Promise((resolve, reject) => {
                for (let i = 0; i < this.tempdb.length; i++) {
                    fs_1.default.rename(this.tempdb[i].path, this.db.dbpath + '/' + this.tempdb[i].title, (err) => {
                        if (err)
                            reject(new Error(`Failed migrating ${this.tempdb[i].path} to live database.`));
                    });
                }
                let response = { success: true, message: 'Move successful.' };
                resolve(response);
            });
        });
    }
    deleteDir(dir) {
        console.log(`[DEBUG] deleteDir() entered`);
        fs_1.default.rmdir(dir, (err) => {
            if (err)
                throw new Error(`Directory ${dir} could not be deleted: ${err}`);
        });
    }
    deleteFile(file) {
        console.log(`[DEBUG] deleteFile() entered`);
        fs_1.default.unlink(file, (err) => {
            if (err)
                throw new Error(`File ${file} could not be deleted: ${err}`);
        });
    }
}
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
