import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
//import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service'; // Adjust this path as needed
import { Router } from '@angular/router';
import { GlobalService } from '../services/global.service';
import { UserService } from '../services/user.service';
import { LoginDTO } from '../models/login-dto';
import { SharedDataService } from '../services/shared-data.service';

@Component({
  selector: 'app-userlogin',
  //standalone: true,
  //imports: [CommonModule,
  //          ReactiveFormsModule
  //],
  templateUrl: './userlogin.component.html',
  styleUrl: './userlogin.component.scss'
})

export class UserloginComponent implements OnInit {

    loginForm: FormGroup;
    errorMessage: string = '';
    showPopup: boolean = false;
    showPassword: boolean = false;
    businessEntityName: string = '';

    constructor(private fb: FormBuilder, 
                private authService: AuthService, 
                private userService: UserService,
                private router: Router,
                private globalService: GlobalService,
                private sharedDataService: SharedDataService) {
      this.loginForm = this.fb.group({
        userId: ['', [Validators.required, Validators.minLength(6)]],
        password: ['', [Validators.required, Validators.minLength(6)]]
      });
    }
  
    ngOnInit(): void {
      // Initialization logic here if needed
    }
    
    onSubmit(): void {
      if (this.loginForm.valid) {
        const loginDTO: LoginDTO = {
          userId: this.loginForm.value.userId,
          passWord: this.loginForm.value.password
        };
        
        this.userService.login(loginDTO).subscribe({
          next: (response) => {
         
            if (response.message === 'Login successful') {
              localStorage.setItem('authToken', response.accessToken);
              console.log('Auth Token:', response.accessToken);
              console.log('Login Successful!', response.user);
              if (response.user) {
                this.globalService.setUserId(response.user.user_id);
                this.globalService.setUserName(response.user.user_first_name_tx);
                this.globalService.setUserLastName(response.user.user_last_name_tx);
                this.globalService.setIsLogged(true);
                this.globalService.setCompanyId(response.user.company_id);
                this.globalService.setEntityImage(response.user.base_url_tx);

                // Call getBusinessEntityName with the company_id
                  this.userService.getBusinessEntityName(response.user.company_id).subscribe({
                  next: (response: string) => {
                    this.businessEntityName = response;
                    localStorage.setItem('businessEntityName', this.businessEntityName);
                  }
                  ,
                  error: (err) => {
                    // Handle error here
                    console.error('Error fetching business entity name:', err);
                  },
                  complete: () => {
                    // Handle completion here if needed
                    this.globalService.setBusinessEntityName(this.businessEntityName);
                    this.sharedDataService.setBusinessEntityName(this.businessEntityName);
                    console.log('Login Get Business Entity Name:', this.businessEntityName );
                  }
                });

                    // Navigate to the dashboard after setting the business entity name
                    //this.router.navigate(['/dashboard']);
                    this.router.navigate(['/dashboard'], { queryParams: { businessEntityName: this.businessEntityName } });
              } else {
                console.error('User object is undefined');
              }
  
            } else {
              console.log('Login Not Successful', response);
              this.errorMessage = response.message;
              this.showPopup = true;
              setTimeout(() => this.showPopup = false, 3000);               
            }
          },
          error: (error: any) => {
            console.error('Login failed', error);
                   this.errorMessage = error.message;
                    this.showPopup = true;
                    setTimeout(() => this.showPopup = false, 3000); 
          }
        });

        
      }
    }

  }