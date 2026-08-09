import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service'; 

@Component({
  selector: 'app-logout-dialog',
  templateUrl: './logout-dialog.component.html',
  styleUrls: ['./logout-dialog.component.scss']
})
export class LogoutDialogComponent {
  constructor(
    private router: Router,
    private userService: UserService,
    private dialogRef: MatDialogRef<LogoutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, message: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onLogout(): void {
    this.userService.logout(); // Call the logout method from your AuthService
    this.router.navigate(['/login']);
    this.dialogRef.close(true);
  }
}
