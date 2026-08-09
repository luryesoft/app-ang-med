import { Component , OnInit} from '@angular/core';
import { GlobalService } from '../services/global.service';
import { Router } from '@angular/router';
import { MatMenu } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { LogoutDialogComponent } from '../logout-dialog/logout-dialog.component';
import { SharedDataService } from '../services/shared-data.service';  
import { AuthService } from '../auth/auth.service';

interface SecMenuItem {
  object_id: number;
  access_in: string;
}
@Component({
  selector: 'app-layout',
 
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})

  export class LayoutComponent implements OnInit {
    userId!: string;
    userName!: string;
    userLastName!: string;
    isLoggedIn!: boolean;
    companyId!: number;
    companyName!: string;
    businessEntityName!: string;
    menu: MatMenu = {} as MatMenu;
    isSidenavOpen = false;
    secMenu: { [key: number]: string } = {};
    onActivate(event: any) {
      if (event && event.companyNameChange) {
        event.companyNameChange.subscribe((name: string) => {
          this.companyName = name;
        });
      }


    }  

    toggleSidenav() {
      this.isSidenavOpen = !this.isSidenavOpen;
    }

    constructor(private globalService: GlobalService,  
      private router: Router, 
      private dialog: MatDialog,
      private sharedDataService: SharedDataService,
      private authService: AuthService
    ) {}
  
    ngOnInit(): void {
      this.userId = this.globalService.getUserId();
      this.userName = this.globalService.getUserName();
      this.userLastName = this.globalService.getUserLastName();
      this.isLoggedIn = this.globalService. getLoginStatus();
      this.companyId = this.globalService.getCompanyId();
      this.businessEntityName = this.globalService.getBusinessEntityName();
       //security menu
       this.fetchSecMenuProfile();

    this.sharedDataService.businessEntityName$.subscribe(name => {
      if (name) { 
        this.businessEntityName = name;
        localStorage.setItem('businessEntityName', this.businessEntityName);
      } else {
        // Fallback to localStorage if the service does not provide a value
        this.businessEntityName = localStorage.getItem('businessEntityName') || '';
      }
        console.log('Layout assigned value:', this.businessEntityName);
      });

      // Log the value retrieved from localStorage
      console.log('Local Storage assigned value:', this.businessEntityName);
      }

      fetchSecMenuProfile(): void {
        this.sharedDataService.getSecMenuProfile(this.userId).subscribe(
          data => {
            this.secMenu = {};
            data.forEach((item: SecMenuItem) => {
              this.secMenu[item.object_id] = item.access_in;
            });
      
            console.log('Updated security menu:', this.secMenu);  
          },
          error => {
            console.error('Error fetching sec menu profile:', error);
          }
        );
      }
    

    openLogoutDialog(): void {
      const dialogRef = this.dialog.open(LogoutDialogComponent, {
        width: '400px',  // Set the desired width
        height: '150px', // Set the desired height
        data: { message: 'Are you sure you want to logout?' , title: 'Logout'}
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Perform logout action
          console.log('User logged out');
          this.logout();
        }
      });
    }
      logout(): void {
        // Perform logout logic here, e.g., clearing tokens, redirecting, etc.
        this.authService.logout();  
        this.globalService.clearsessionStorage();
        localStorage.removeItem('authToken');
        localStorage.removeItem('businessEntityName');
        this.router.navigate(['/login']);
    }
  }