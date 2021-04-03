import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionFactoryComponent } from './collection-factory.component';

describe('CollectionFactoryComponent', () => {
  let component: CollectionFactoryComponent;
  let fixture: ComponentFixture<CollectionFactoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CollectionFactoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionFactoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
