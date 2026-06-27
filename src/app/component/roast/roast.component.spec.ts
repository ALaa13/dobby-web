import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoastComponent } from './roast.component';

describe('RoastComponent', () => {
  let component: RoastComponent;
  let fixture: ComponentFixture<RoastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoastComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RoastComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
