import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'
import { DatabaseService } from '../database/database.service';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

import { CollectionFactoryComponent } from '../modals/collection-factory/collection-factory.component';
import { MangaData } from '../database/api.interfaces';

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
    private router: Router
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

  private async getCollections() {
    var res = await this.db.getCollections();
    if (res.status == 200) {
      this.collections = res.body;
    } else {
      console.log(`List Status Code ${res.status}.`);
      this.collections = [];
    }
  }

  read(title) {
    console.log(`read ${title}`);
    this.router.navigate(['read', title]);
  }



}

/*
  Todo for collection page:
    - List out collections better
*/
