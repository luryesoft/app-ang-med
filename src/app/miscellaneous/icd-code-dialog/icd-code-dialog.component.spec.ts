import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IcdCodeDialogComponent } from './icd-code-dialog.component';

describe('IcdCodeDialogComponent', () => {
  let component: IcdCodeDialogComponent;
  let fixture: ComponentFixture<IcdCodeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IcdCodeDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IcdCodeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
