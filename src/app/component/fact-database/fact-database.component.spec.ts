import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactDatabaseComponent } from './fact-database.component';

describe('FactDatabaseComponent', () => {
  let component: FactDatabaseComponent;
  let fixture: ComponentFixture<FactDatabaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FactDatabaseComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FactDatabaseComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
