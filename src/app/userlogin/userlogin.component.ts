import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { GlobalService } from '../services/global.service';
import { UserService } from '../services/user.service';
import { LoginDTO } from '../models/login-dto';
import { SharedDataService } from '../services/shared-data.service';

@Component({
  selector: 'app-userlogin',
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
    }

    onSubmit(): void {
      if (this.loginForm.valid) {
        const loginDTO: LoginDTO = {
          userId: this.loginForm.value.userId,
          passWord: this.loginForm.value.password
        };

        this.authService.login(loginDTO).subscribe({
          next: (response) => {
            if (!this.authService.isLoggedIn) {
              this.showError(response?.message || 'Login succeeded but the session token is invalid.');
              return;
            }

            if (response.user) {
              this.globalService.setUserId(response.user.user_id);
              this.globalService.setUserName(response.user.user_first_name_tx);
              this.globalService.setUserLastName(response.user.user_last_name_tx);
              this.globalService.setIsLogged(true);
              this.globalService.setCompanyId(response.user.company_id);
              this.globalService.setEntityImage(response.user.base_url_tx);

              this.userService.getBusinessEntityName(response.user.company_id).subscribe({
                next: (name: string) => {
                  this.businessEntityName = name;
                  this.globalService.setBusinessEntityName(this.businessEntityName);
                  this.sharedDataService.setBusinessEntityName(this.businessEntityName);
                },
                error: (err) => {
                  console.error('Error fetching business entity name:', err);
                }
              });

              this.router.navigate(['/dashboard']);
            } else {
              this.showError('User object is undefined');
            }
          },
          error: (error: any) => {
            this.showError(error.message);
          }
        });
      }
    }

    private showError(message: string): void {
      this.errorMessage = message;
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 3000);
    }
}
