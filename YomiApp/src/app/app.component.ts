import { Component, ViewChild } from '@angular/core';

import { MatSidenav } from '@angular/material/sidenav'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'YomiApp';
  @ViewChild('snav') snav: MatSidenav;


}
