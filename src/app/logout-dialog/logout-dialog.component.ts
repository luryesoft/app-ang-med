import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-logout-dialog',
  templateUrl: './logout-dialog.component.html',
  styleUrls: ['./logout-dialog.component.scss']
})
export class LogoutDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<LogoutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, message: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onLogout(): void {
    this.dialogRef.close(true);
  }
}
