import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  baseurl:string = 'http://localhost:6969'

  constructor(
    private http: HttpClient
  ) { }

  async getList() {
    let url = this.baseurl + '/list';
    let list = await this.http.get(url).toPromise();
    return list;
  }

  async getCoverImage(title) {
    let url = this.baseurl + `/manga/${title}`;
    let manga:any = await this.http.get(url).toPromise();

    return manga.pages[0];
  }
}
