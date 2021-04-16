import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'
import { DatabaseService } from '../database/database.service';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

import { CollectionFactoryComponent } from '../modals/collection-factory/collection-factory.component';
import { CommonAPIResult } from '../database/api.interfaces';

@Component({
  selector: 'app-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss']
})
export class CollectionsComponent implements OnInit {

  public collections: Array<any>;

  constructor(
    private db: DatabaseService,
    private dialog: MatDialog,
    private router: Router,
    private _snackBar: MatSnackBar,
  ) {
    this.getCollections();
  }

  async ngOnInit(): Promise<void> {
  }

  public openCollectionFactory() {
    const dialogRef = this.dialog.open(CollectionFactoryComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe( async () => {
      console.log('The Collection Factory was closed');
      await this.getCollections();
    });
  }

  //Get the collection list from the database.
  private async getCollections() {
    var res = await this.db.getCollections();
    if (res.status == 200) {
      this.collections = res.body;
    } else {
      console.log(`List Status Code ${res.status}.`);
      this.collections = [];
    }
  }

  //Open read page by title.
  public read(title: string) {
    console.log(`read ${title}`);
    this.router.navigate(['read', title]);
  }

  //Delete a collection by ID.
  public async deleteCol(id: string) {
    let res: CommonAPIResult = await this.db.deleteCollection(id);
    if (res.success == true) {
      await this.getCollections();
      this.openSnackBar('Collection has been deleted', 'Great');
    } else {
      this.openSnackBar('Failed to delete', ':(');
    }

  }


  private openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }
}

/*
  Todo for collection page:
    - List out collections better
*/
