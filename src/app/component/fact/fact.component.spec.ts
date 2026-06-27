import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactComponent } from './fact.component';

describe('FactComponent', () => {
  let component: FactComponent;
  let fixture: ComponentFixture<FactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FactComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FactComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
