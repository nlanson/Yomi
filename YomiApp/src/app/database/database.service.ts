import { Injectable } from '@angular/core';

import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  //baseurl:string = 'https://mdb.nlanson.ga' //Connects to the proxy for the database (My production setup)
  baseurl: string = 'http://localhost:6969' //Connects to local machine of the client (Testing on local machine)

  /*
    Need to find a way for users to set there own proxy url to their version of the hosted database.
  */

  constructor(
    private http: HttpClient
  ) { }

  async getList(): Promise<any> {
    await this.refreshdb();
    let url = this.baseurl + '/list';
    let list = await this.http.get(url, {observe: 'response'}).toPromise();

    return list;
  }

  async getManga(title): Promise<any> {
    let url = this.baseurl + `/manga/${title}`;
    let manga = await this.http.get(url, {observe: 'response'}).toPromise();

    return manga;
  }

  async getCoverImage(title): Promise<any> {
    let url = this.baseurl + `/manga/${title}`;
    let res:any = await this.http.get(url, {observe: 'response'}).toPromise();

    return res;
  }

  async refreshdb(): Promise<Boolean> {
    let url = this.baseurl + '/refresh'
    let status:any = await this.http.get(url, {observe: 'response'}).toPromise();

    if (status.status == 200)  { return true }
    else { console.log('Refresh Failed'); return false }
  }

  async editManga(editObj): Promise<any> {
    let editString = JSON.stringify(editObj);
    let url = this.baseurl + '/editManga/' + editString;
    let res: any = await this.http.get(url, {observe: 'response'}).toPromise();

    return res;
  }

  upload(file: File) {
    let url = this.baseurl + '/upload';
    let fd = new FormData();
    fd.append('file', file, file.name);

    return this.http.post(url, fd, {
      reportProgress: true,
      observe: 'events'
    });
  }

  async delete(title: string): Promise<any> {
    let delobj = {title: title};
    let delString = JSON.stringify(delobj);
    let url = this.baseurl + '/deleteManga/' + delString;
    let res: any = await this.http.get(url, {observe: 'response'}).toPromise();

    return res;
  }


}
