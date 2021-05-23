import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router'

import { DatabaseService } from '../../database/database.service';
import { LibraryComponent } from '../../library/library.component';
import { EditMangaComponent } from '../../modals/edit-manga/edit-manga.component';
import { MangaData } from '../../database/api.interfaces';
import { CollectionsComponent } from '../../collections/collections.component';

type CalledFrom = 'CollectionInfo' | 'Library';

@Component({
  selector: 'Book-Card',
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.scss']
})
export class BookCardComponent implements OnInit {

  @Input() manga: Required<MangaData>;
  @Input() enableMangaDelete: boolean;
  @Input() caller?: CalledFrom;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private _snackBar: MatSnackBar,
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

      this.refreshCallerViewAfterUpdate();
    });

  }

  refreshCallerViewAfterUpdate() {
    switch(this.caller){
      case 'Library':
        this.lib.getList();
        break;
      case 'CollectionInfo':
        this.colc.getCollections();
        break;
      default:
        this.lib.getList();
        this.colc.getCollections();
    }
  }

  showInfo() {
    console.log(this.manga.title);
  }

  //Only accessible from LibC atm.
  //May have to bring LibC delete pipe into here.
  deleteManga() {
    this.lib.deleteManga(this.manga.title);
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }
}
