import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LibraryComponent } from './library/library.component';
import { CollectionsComponent } from './collections/collections.component';

const routes: Routes = [
  { path: 'library', component: LibraryComponent },
  { path: 'collections', component: CollectionsComponent },
  { path: '**', component: LibraryComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
