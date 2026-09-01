import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalService } from './services/global.service';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  template: `<h1>Hello, {{ title }}</h1>`,
  imports: [RouterOutlet]
})

/*
export class AppComponent {
  title = 'ang_med';
}
  */
export class AppComponent implements OnInit {

  title = 'ang_med';
  userName: string = '';
  userLastName: string = '';
  companyid: number = -1;
  islogged: boolean = false;
  userId:string ='';

  constructor(
    private globalService: GlobalService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.authService.enforceBrowserSession();
    // Access or modify global variables
    this.userName = this.globalService.getUserName();
    this.globalService.userName = this.userName;
    this.userLastName = this.globalService.getUserLastName();
    this.globalService.userLastName = this.userLastName;
    this.islogged = this.globalService.getLoginStatus();
    this.companyid = this.globalService.getCompanyId();
    this.globalService.companyId  =  this.companyid;
    this.userId = this.globalService.getUserId();
    this.globalService.userId = this.userId
  }

  
}