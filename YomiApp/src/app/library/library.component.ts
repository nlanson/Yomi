import { Component, OnInit, ViewChild } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { Router } from '@angular/router'

import { EditMangaComponent } from '../modals/edit-manga/edit-manga.component';

import {MatGridList} from '@angular/material/grid-list';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { UploadMangaComponent } from '../modals/upload-manga/upload-manga.component';


@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent implements OnInit {
  @ViewChild('grid') grid: MatGridList;

  list: any;

  constructor(
    private db: DatabaseService,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.getList();
  }

  ngOnInit(): void {
  }

  async getList() {
    var res = await this.db.getList();
    if (res.status == 200) {
      this.list = res.body;
    } else {
      console.log(`List Status Code ${res.status}.`);
      this.list = [];
    }
  }

  read(title) {
    console.log(`read ${title}`);
    this.router.navigate(['read', title]);
  }

  getMangaCover(title) {
    return new Promise(async (resolve) => {
      let res = await this.db.getCoverImage(title);
      let cover: string;
      if ( res.status == 200 ) { //Need prod test
        cover = res.body.pages[0];
      } else if ( res.status == 411 ) {
        console.log('Manga was not found... (Cover)');
        cover = 'https://store.charteredaccountantsanz.com/sca-dev-kilimanjaro/img/no_image_available.jpeg' //Not avail jpg
      }

      console.log(`Cover for ${title} is at ${cover}`);
      resolve(cover);
    });
  }

  openEdit(mangaName): void {
    const dialogRef = this.dialog.open(EditMangaComponent, {
      width: '250px',
      data: { title: mangaName }
    });

    dialogRef.afterClosed().subscribe( async () => {
      console.log('The Edit dialog was closed');
      await this.getList();
    });

  }

  openUpload() {
    const dialogRef = this.dialog.open(UploadMangaComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe( async () => {
      console.log('The Upload dialog was closed');
      await this.getList();
    });
  }

}
