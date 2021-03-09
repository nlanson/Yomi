import { Component, ViewChild } from '@angular/core';

import { MatSidenav } from '@angular/material/sidenav'
import {MatSnackBar} from '@angular/material/snack-bar';

import { DatabaseService } from './database/database.service';
import { LibraryComponent } from './library/library.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'YomiApp';
  @ViewChild('snav') snav: MatSidenav;

  constructor(
    private db: DatabaseService,
    private libc: LibraryComponent,
    private _snackBar: MatSnackBar
  ) { }


  async refreshdb() {
    let refreshed = await this.db.refreshdb();

    if (refreshed) {
      this.openSnackBar('Refreshed!', 'Ok');
      await this.libc.getList();
    }
    else this.openSnackBar('Epic Refresh Failure!', 'LOL');
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000,
    });
  }

}
