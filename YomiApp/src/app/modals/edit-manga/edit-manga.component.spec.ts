import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMangaComponent } from './edit-manga.component';

describe('EditMangaComponent', () => {
  let component: EditMangaComponent;
  let fixture: ComponentFixture<EditMangaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditMangaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditMangaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
