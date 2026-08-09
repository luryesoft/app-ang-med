import { Component , OnInit} from '@angular/core';
import { GlobalService } from '../services/global.service';
import { Router } from '@angular/router';
import { MatMenu } from '@angular/material/menu';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  userId!: string;
  userName!: string;
  userLastName!: string;
  isLoggedIn!: boolean;
  companyId!: number;
  businessEntityName!: string;
  menu: MatMenu = {} as MatMenu;

  constructor(private globalService: GlobalService,  private router: Router) {}

  ngOnInit(): void {
    this.userId = this.globalService.getUserId();
    this.userName = this.globalService.getUserName();
    this.userLastName = this.globalService.getUserLastName();
    this.isLoggedIn = this.globalService. getLoginStatus();
    this.companyId = this.globalService.getCompanyId();
    this.businessEntityName = this.globalService.getBusinessEntityName();
    //console.log(String(this.userId));
    console.log(this.userId);
    
  }

  logout() {
    //this.authService.logout();
    this.router.navigate(['/userlogin']);
  }

  

}
