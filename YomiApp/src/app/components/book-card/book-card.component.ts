import { Component, OnInit, Input } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import { Router } from '@angular/router'

import { DatabaseService } from '../../database/database.service';
import { LibraryComponent } from '../../library/library.component';
import { EditMangaComponent } from '../../modals/edit-manga/edit-manga.component';
import { CommonAPIResult, MangaData } from '../../database/api.interfaces';

@Component({
  selector: 'Book-Card',
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.scss']
})
export class BookCardComponent implements OnInit {

  @Input() manga: MangaData;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private db: DatabaseService,
    private lib: LibraryComponent
  ) { }

  ngOnInit(): void {
  }

  read() {
    console.log(`read ${this.manga.title}`);
    this.router.navigate(['read', this.manga.title]);
  }

  openEdit(): void {
    const dialogRef = this.dialog.open(EditMangaComponent, {
      width: '250px',
      data: { title: this.manga.title }
    });

    dialogRef.afterClosed().subscribe( async () => {
      console.log('The Edit dialog was closed');
      this.lib.getList();
    });

  }

  showInfo() {
    console.log(this.manga.title);
  }

  deleteManga() {
    let r: CommonAPIResult;
    this.db.delete(this.manga.title).subscribe(
      data => {
        r = data.body;
        if ( r.status == 'success' )
          this.openSnackBar(`${this.manga.title} has been deleted`, `Thanks`);
          this.lib.getList();
        },
      err => {
        r = err.error;
        console.log(err.status);
        this.openSnackBar(`${r.message}`, `Noooo`);
        this.lib.getList();
      }
    );
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }
}
