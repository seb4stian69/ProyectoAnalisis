import { TestBed } from '@angular/core/testing';

import { InterpolationapiService } from './interpolationapi.service';

describe('InterpolationapiService', () => {
  let service: InterpolationapiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InterpolationapiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
