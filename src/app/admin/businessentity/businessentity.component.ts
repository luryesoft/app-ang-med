import { Component, OnInit,Output,EventEmitter} from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GlobalService } from '../../services/global.service';
import { BusinessEntityService } from '../../services/business-entity.service';
import { WarningModalComponent } from '../../warning-modal/warning-modal.component';
import { MatDialog } from '@angular/material/dialog';


interface secprofile {
  sec_profile_id: number;
  sec_profile_nm: string;
}

interface User {
  user_id: number;
  password_tx: string;
  user_first_name_tx: string;
  user_last_name_tx: string;
  user_email_tx: string;
  company_id: number;
  sec_profile_id: number;
}

@Component({
  selector: 'app-businessentity',
  standalone: false,
  templateUrl: './businessentity.component.html',
  styleUrl: './businessentity.component.scss'
})
export class BusinessentityComponent implements OnInit {
  @Output() companyNameChange = new EventEmitter<string>(); // EventEmitter to emit company name
  companyId!: number;
  userId!: string;
  userLastName!: string;
  businessEntityForm!: FormGroup;
  companyName!: string;
  errorMessage: string = '';
  successMessage: string = ''; // Add success message property
  showPopup: boolean = false;
  showSuccessPopup: boolean = false; // Add su
  dataSource: any[] = [];
  userForm!: FormGroup;
  users: User[] = [];
  selectedUser: User = {} as User;
  secprofiles: secprofile[] = []; 
  hidePassword: boolean = true;
  isEditMode: boolean = false;
  formDirty: boolean = false;
  cardHeader: string = 'The Boss';
  entityId: number = 0;

  togglePasswordVisibility(): void {
        this.hidePassword = !this.hidePassword;


    }
  constructor(private globalService: GlobalService,  
    private router: Router, 
    private businessEntityService: BusinessEntityService,
    private fb: FormBuilder,
    private dialog: MatDialog) 
    {

    
    }


  ngOnInit(): void {
    
    this.userId = this.globalService.getUserId();
    this.userLastName = this.globalService.getUserLastName();
    this.companyId = this.globalService.getCompanyId();
    this.entityId = this.companyId;
    this.businessEntityForm = this.fb.group({
      entity_id: [null],
      entity_name: [{ value: '', disabled: true }, Validators.required], 
      entity_address: [''] ,
      entity_city: [''],
      entity_state: [''],
      entity_zip: [''],
      entity_phone: [''],
      entity_license_number_tx: [''],
      entity_tax_ein_id: [{ value: '', disabled: true }, Validators.required],
      entity_email: [''],
      billing_address: [''],
      billing_city: [''],
      billing_state: [''],
      billing_zip: ['']   
    });

    this.userForm = this.fb.group({
      user_id: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(10)]],
      user_first_name_tx: ['', Validators.required],
      user_last_name_tx: ['', Validators.required],
      user_email_tx: ['',[Validators.required, Validators.email]],
      company_id: [this.companyId],
      password_tx: ['', [Validators.required, Validators.minLength(6), Validators.pattern('^(?=.*[a-zA-Z])(?=.*[0-9])[A-Za-z0-9?!$@]+$')]],
      sec_profile_id: [null, Validators.required]
    });

    this.loadSecurityProfiles();

    this.businessEntityService.getBusinessEntity(this.companyId).subscribe({
      next: data => {
        {
          this.businessEntityForm.patchValue({
            entity_id: data.entity_id,
            entity_name: data.entity_name,
            entity_address: data.entity_address,
            entity_city: data.entity_city,
            entity_state: data.entity_state,
            entity_zip: data.entity_zip,
            entity_phone: data.entity_phone,
            entity_license_number_tx: data.entity_license_number_tx,
            entity_tax_ein_id: data.entity_tax_ein_id,
            entity_email: data.entity_email,
            billing_address: data.billing_address,
            billing_city: data.billing_city,
            billing_state: data.billing_state,
            billing_zip: data.billing_zip
          });
          this.companyName = data.entity_name;
          this.companyNameChange.emit(this.companyName); // Emit the company name
        }
      },
      error: error => {
        console.error('Error fetching business entity:', error);
      }}
    );
    this.loadUsers();

  }

  loadUsers(): void {
    const entityId = this.companyId; 
    this.businessEntityService.getUsersByEntity(entityId).subscribe(
      (data) => {
        this.users = data;
        console.log('Users:', this.users);
      },
      (error) => {
        console.error('Error:', error);
        this.errorMessage = 'Failed to load users';
      }
    );
  }
  onSubmit(): void {
    if (this.businessEntityForm.valid) {
      this.businessEntityService.updateBusinessEntity(this.companyId, this.businessEntityForm.value).subscribe({
        next: response => {
          console.log('Business entity updated successfully', response);
          console.log('Business entity updated successfully', response);
          this.successMessage = 'Business entity updated successfully!';
          this.showSuccessPopup = true;
          setTimeout(() => this.showSuccessPopup = false, 3000);// Optionally, you can add more logic here, like showing a success message or redirecting
        },
        error: err => {
          console.error('Error updating business entity', err);
          this.errorMessage = this.extractErrorMessage(err);
          this.showPopup = true;
          setTimeout(() => this.showPopup = false, 3000); 
          // Optionally, handle the error here, like showing an error message
        }
      });
    }
  }
  onUserSubmit(): void {
    if (this.isEditMode){
      this.updateUser();
    }else{
      this.addUser();
    }
  }

  getImageUrl(entityId: number): string {
    if (entityId==1){
    //  this.cardHeader = 'Doctor Watson';
      return '../assets/images/watson.jpg';
    }
    else if (entityId==2){
    //  this.cardHeader = 'Mr. Bazel';
      return '../assets/images/bazel.jpg';
    }
    else{
    //  this.cardHeader = 'Dr. Mike';
      return '../assets/images/mike.jpg';
    }
  }

  addUser():void{
    if (this.userForm.valid) {
        const updatedUser = this.userForm.value;
        console.log('User submitted:', updatedUser);

        this.businessEntityService.insertUser(this.userForm.value).subscribe({
            next: response => {
                console.log('User updated successfully', response);
                this.successMessage = 'User updated successfully!';
                this.showSuccessPopup = true;
                setTimeout(() => this.showSuccessPopup = false, 3000);
                this.loadUsers();
                this.isEditMode = true;
            },
            error: err => {
                console.error('Error updating user', err);
                this.errorMessage = this.extractErrorMessage(err);
                this.showPopup = true;
                setTimeout(() => this.showPopup = false, 3000);
            }
        });
    } else {
        console.error('User form is invalid');
        this.errorMessage = 'Please fill in all required fields correctly.';
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 3000);
    }
}  

updateUser():void{
  if (this.userForm.valid) {
      const updatedUser = this.userForm.value;
      console.log('User submitted:', updatedUser);

      this.businessEntityService.updateUser( updatedUser).subscribe({
          next: response => {
              console.log('User updated successfully', response);
              this.successMessage = 'User updated successfully!';
              this.showSuccessPopup = true;
              setTimeout(() => this.showSuccessPopup = false, 3000);
              this.loadUsers();
              // Optionally, refresh the user list or perform other actions
          },
          error: err => {
              console.error('Error updating user', err);
              this.errorMessage = this.extractErrorMessage(err);
              this.showPopup = true;
              setTimeout(() => this.showPopup = false, 3000);
          }
      });
  } else {
      console.error('User form is invalid');
      this.errorMessage = 'Please fill in all required fields correctly.';
      this.showPopup = true;
      setTimeout(() => this.showPopup = false, 3000);
  }
}

  switchToAddMode() {
    this.isEditMode = false;
    this.resetUserForm();
    this.formDirty = false;
    console.log('Switching to add mode');
}

  private resetUserForm(): void {
    this.userForm.reset({
        user_id: null,
        user_first_name_tx: '',
        user_last_name_tx: '',
        user_email_tx: '',
        company_id: this.companyId, // Reset to the current companyId
        password_tx: '',
        sec_profile_id: null
  });
}
  private extractErrorMessage(error: any): string {
    if (error.error && error.error.message) {
      if (Array.isArray(error.error.message)) {
        return error.error.message.join(', ');
      } else {
        return error.error.message;
      }
    }
    return 'An unexpected error occurred';
  }


  confirmAndDeleteUser(message: string, username: string): void {
    const dialogRef = this.dialog.open(WarningModalComponent, {
      data: { message: message }
    });
  
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        console.log('User confirmed the action');
        this.deleteUser(username);
      } else {
        console.log('User canceled the action');
        // Handle the cancellation action
      }
    });
  }


  selectUser(user: User): void {
    console.log('Selected user:', user);
    this.selectedUser = user; 
    this.userForm.patchValue({
      user_first_name_tx: user.user_first_name_tx,
      user_last_name_tx: user.user_last_name_tx,
      user_id: user.user_id,
      user_email_tx: user.user_email_tx,
      password_tx: user.password_tx, // Ensure this field exists in the User interface
      sec_profile_id: user.sec_profile_id
    });
    this.isEditMode = true;
  }

  private loadSecurityProfiles(): void {
    this.businessEntityService.getSecurityProfiles().subscribe({
      next: (data) => {
        this.secprofiles = data;
        console.log('Security Profiles:', this.secprofiles);
      },
      error: (error) => {
        console.error('Error fetching security profiles:', error);
      }
    });
  }

  deleteUser(username: string): void {
    this.businessEntityService.deleteUser(username).subscribe({
      next: (response) => {
        this.successMessage = 'User deleted successfully!';
        this.showSuccessPopup = true;
        setTimeout(() => this.showSuccessPopup = false, 3000);
        this.loadUsers(); 
        this.resetUserForm();
        this.isEditMode = false;
        console.log('User deleted successfully:', response);
        // Optionally, update the UI or notify the user
      },
      error: (error) => {
        console.error('There was an error deleting the user:', error);
        this.errorMessage = this.extractErrorMessage(error);
        this.showPopup = true;
        setTimeout(() => this.showPopup = false, 3000);
      }
    });
  }

}
