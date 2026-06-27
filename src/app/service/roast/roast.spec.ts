import { TestBed } from '@angular/core/testing';

import { Roast } from './roast';

describe('Roast', () => {
  let service: Roast;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Roast);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
