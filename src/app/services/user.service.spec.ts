
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Add this line
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle unexpected error', () => {
    service.login({userId: 'test@example.com', passWord: 'password'}).subscribe({
      next: () => fail('should have failed with an error'),
      error: (error) => {
        expect(error.message).toBe('An unexpected error occurred');
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/api/userlogin');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });
});