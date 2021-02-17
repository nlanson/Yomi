import { Component, OnInit, ViewChild } from '@angular/core';
import { DatabaseService } from '../database/database.service';

import {MatGridList} from '@angular/material/grid-list';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent implements OnInit {
  @ViewChild('grid') grid: MatGridList;

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
