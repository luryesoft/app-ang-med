import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-warning-modal',
  templateUrl: './warning-modal.component.html',
  styleUrls: ['./warning-modal.component.scss']
})
export class WarningModalComponent {
  constructor(
    private dialogRef: MatDialogRef<WarningModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      message: string;
      confirmLabel?: string;
      cancelLabel?: string;
    }
  ) {}

  ngOnInit(): void {
    console.log('WarningModalComponent initialized');
    this.dialogRef.updateSize('650px', '200px');
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
