import { Component, ViewChild } from '@angular/core';

import { MatSidenav } from '@angular/material/sidenav'

import { DatabaseService } from './database/database.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'YomiApp';
  @ViewChild('snav') snav: MatSidenav;

  constructor(
    private db: DatabaseService
  ) { }


  async refreshdb() {
    await this.db.refreshdb();
  }

}
