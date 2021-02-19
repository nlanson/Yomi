import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LibraryComponent } from './library/library.component';
import { CollectionsComponent } from './collections/collections.component';
import { ReadComponent } from './read/read.component';

const routes: Routes = [
  { path: 'library', component: LibraryComponent },
  { path: 'collections', component: CollectionsComponent },
  { path: 'read/:title', component: ReadComponent },
  { path: '**', component: LibraryComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
