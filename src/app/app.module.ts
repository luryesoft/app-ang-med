import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UserloginComponent } from './userlogin/userlogin.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LayoutComponent } from './layout/layout.component';
import { BusinessentityComponent } from './admin//businessentity/businessentity.component'; 
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenu } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { PhoneNumberPipe } from './pipes/phone-number.pipe';
import { FacilitiesComponent } from './facilities/facilities.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { WarningModalComponent } from './warning-modal/warning-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ProvidersComponent } from './providers/providers.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { FacilityDialogComponent } from './facility-dialog/facility-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';   
import { MatSlideToggleModule } from '@angular/material/slide-toggle';  
import { CanDeactivateGuard } from './guards/can-deactivate.guard';
import { LawFirmComponent } from './law-firm/law-firm.component';
import { InsuranceComponent } from './insurance/insurance.component';
import { MiscellaneousComponent } from './miscellaneous/miscellaneous.component';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort'; 
import { CptCodeDialogComponent } from './cpt-code-dialog/cpt-code-dialog.component'; 
import { IcdCodeDialogComponent } from './miscellaneous/icd-code-dialog/icd-code-dialog.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientsComponent } from './patients/patients.component';
import { ReportsComponent } from './reports/reports.component';
import { SsnMaskPipe } from './pipes/ssn-mask.pipe';
import { NumericOnlyDirective } from './pipes/numeric-only.directive';
import { NgxMaskDirective ,  provideNgxMask} from 'ngx-mask'; 
import { JwtInterceptor } from './auth/jwt.interceptor';
import { OAuthModule } from 'angular-oauth2-oidc'; 
import { PdfComponent } from './pdfgen/pdfgen.component';


@NgModule({
  declarations: [ 
    DashboardComponent,
    UserloginComponent,
    LayoutComponent,
    BusinessentityComponent,
    FacilitiesComponent,
    PhoneNumberPipe,
    WarningModalComponent,
    ProvidersComponent,
    FacilityDialogComponent,
    LawFirmComponent,
    InsuranceComponent,
    MiscellaneousComponent,
    CptCodeDialogComponent,
    IcdCodeDialogComponent,
    PatientsComponent,
    SsnMaskPipe,
    NumericOnlyDirective,
   // ReportsComponent,
   PdfComponent
  ],
  imports: [
    AppComponent,
    BrowserModule,
    FormsModule,  
    ReactiveFormsModule,
    MatCardModule,
    CommonModule,
    BrowserAnimationsModule,
    MatMenuModule,
    MatButtonModule,
    MatToolbarModule,
    AppRoutingModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenu,  
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatDialogModule,
    MatSidenavModule,
    MatListModule,
    MatTooltipModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatTableModule,
    MatSortModule,
    MatDialogModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    NgxMaskDirective,
    OAuthModule.forRoot()
   // RouterModule.forRoot([] )
  ],
  providers: [ 
    provideHttpClient(),
    CanDeactivateGuard,
    provideNgxMask(),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
   ]
})
export class AppModule { }
