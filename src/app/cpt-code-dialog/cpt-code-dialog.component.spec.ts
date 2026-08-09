import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CptCodeDialogComponent } from './cpt-code-dialog.component';

describe('CptCodeDialogComponent', () => {
  let component: CptCodeDialogComponent;
  let fixture: ComponentFixture<CptCodeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CptCodeDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CptCodeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
