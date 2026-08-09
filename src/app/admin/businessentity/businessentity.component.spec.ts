import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessentityComponent } from './businessentity.component';

describe('BusinessentityComponent', () => {
  let component: BusinessentityComponent;
  let fixture: ComponentFixture<BusinessentityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessentityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessentityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
