import { TestBed } from '@angular/core/testing';

import { GlobalService } from './global.service';

describe('GlobalService', () => {
  let service: GlobalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GlobalService] 
    });
    service = TestBed.inject(GlobalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
