import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../database/database.service';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent implements OnInit {

  list: any;

  constructor(
    private db: DatabaseService
  ) {
    this.getList();
  }

  ngOnInit(): void {
  }

  async getList() {
    this.list = await this.db.getList();
    console.log(this.list);
  }

  getMangaCover(title) {
    return new Promise(async (resolve) => {
      let cover = await this.db.getCoverImage(title);
      console.log(`Cover for ${title} is at ${cover}`);
      resolve(cover);
    });
  }

}
