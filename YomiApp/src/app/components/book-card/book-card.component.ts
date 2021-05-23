import { Component, OnInit, Input } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import { Router } from '@angular/router'

import { DatabaseService } from '../../database/database.service';
import { LibraryComponent } from '../../library/library.component';
import { EditMangaComponent } from '../../modals/edit-manga/edit-manga.component';
import { CommonAPIResult, MangaData } from '../../database/api.interfaces';
import { CollectionsComponent } from '../../collections/collections.component';

@Component({
  selector: 'Book-Card',
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.scss']
})
export class BookCardComponent implements OnInit {

  @Input() manga: MangaData;
  @Input() enableMangaDelete: boolean;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private db: DatabaseService,
    private lib: LibraryComponent,
    private colc: CollectionsComponent
  ) { }

  ngOnInit(): void { }

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

      //Refresh all views that could display the manga.
      //Could possibly have an input to define which component this component is called for to filter which component to refresh.
      this.lib.getList();
      this.colc.getCollections();
    });

  }

  showInfo() {
    console.log(this.manga.title);
  }

  deleteManga() {
    this.lib.deleteManga(this.manga.title);
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }
}
