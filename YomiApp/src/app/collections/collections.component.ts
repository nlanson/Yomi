import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

import { CollectionFactoryComponent } from '../modals/collection-factory/collection-factory.component';

@Component({
  selector: 'app-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss']
})
export class CollectionsComponent implements OnInit {

  constructor(
    private db: DatabaseService,
    private dialog: MatDialog,
  ) { }

  async ngOnInit(): Promise<void> {
  }

  openCollectionFactory() {
    const dialogRef = this.dialog.open(CollectionFactoryComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe( async () => {
      console.log('The Collection Factory was closed');
    });
  }



}
