import { Component, OnInit, ViewChild } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { Router } from '@angular/router'

import { EditMangaComponent } from '../modals/edit-manga/edit-manga.component';
import { UploadMangaComponent } from '../modals/upload-manga/upload-manga.component';

import {MatGridList} from '@angular/material/grid-list';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import { CommonAPIResult, MangaData } from '../database/api.interfaces';



@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent implements OnInit {
  @ViewChild('grid') grid: MatGridList;

  list: Array<MangaData>;

  constructor(
    private db: DatabaseService,
    private dialog: MatDialog,
    private router: Router,
    private _snackBar: MatSnackBar
  ) {
    this.getList();
  }

  ngOnInit(): void {
  }

  getList(): void {
    this.db.getList().subscribe(
      data => {
        console.log('Refreshed')
        this.list = data.body;
      },
      err => {
        if (err.error) {
          console.log(`Error retieving list ${err.status}`);
          this.list = [];
        }
      }
    );
  }

  read(title) {
    console.log(`read ${title}`);
    this.router.navigate(['read', title]);
  }

  openEdit(mangaName): void {
    const dialogRef = this.dialog.open(EditMangaComponent, {
      width: '250px',
      data: { title: mangaName }
    });

    dialogRef.afterClosed().subscribe( async () => {
      console.log('The Edit dialog was closed');
      this.getList();
    });

  }

  openUpload() {
    const dialogRef = this.dialog.open(UploadMangaComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe( async () => {
      console.log('The Upload dialog was closed');
      this.getList();
    });
  }

  showInfo(title) {
    console.log(title);
  }

  deleteManga(title) {
    let r: CommonAPIResult;
    this.db.delete(title).subscribe(
      data => {
        r = data.body;
        if ( r.status == 'success' )
          this.openSnackBar(`${title} has been deleted`, `Thanks`);
          this.getList();
        },
      err => {
        r = err.error;
        console.log(err.status);
        this.openSnackBar(`${r.message}`, `Noooo`);
        this.getList();
      }
    );
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }

}
