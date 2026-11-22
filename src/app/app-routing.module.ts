import { NgModule } from '@angular/core';
//import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { UserloginComponent } from './userlogin/userlogin.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LayoutComponent } from './layout/layout.component';
import { BusinessentityComponent } from './admin//businessentity/businessentity.component'; 
import { FacilitiesComponent } from './facilities/facilities.component';
import { ProvidersComponent } from './providers/providers.component';
import { MiscellaneousComponent } from './miscellaneous/miscellaneous.component';
import { LawFirmComponent } from './law-firm/law-firm.component';
import { InsuranceComponent } from './insurance/insurance.component';
import { PatientsComponent } from './patients/patients.component';
import { ReportsComponent } from './reports/reports.component';
import { AuthGuard } from './auth/auth.guard';
import { CanDeactivateGuard } from './guards/can-deactivate.guard';



const routes: Routes = [
  {
    path: '',

    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent , canActivate: [AuthGuard]},
      { path: 'company', component: BusinessentityComponent , canActivate: [AuthGuard]},
      { path: 'facilities', component: FacilitiesComponent , canActivate: [AuthGuard]},
      { path: 'providers', component: ProvidersComponent , canActivate: [AuthGuard]},
      { path: 'miscellaneous', component: MiscellaneousComponent , canActivate: [AuthGuard]},
      { path: 'law_firm', component: LawFirmComponent , canActivate: [AuthGuard]},
      { path: 'insurance', component: InsuranceComponent , canActivate: [AuthGuard]},
      { path: 'patients', component: PatientsComponent , canActivate: [AuthGuard], canDeactivate: [CanDeactivateGuard]},
      { path: 'reports', component: ReportsComponent , canActivate: [AuthGuard]},
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' } 
    ]
  },
  { path: 'userlogin', component: UserloginComponent },
  { path: '**', redirectTo: '/userlogin' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
