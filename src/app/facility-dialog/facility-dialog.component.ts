
import { NgModule } from '@angular/core';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FacilitiesDTO } from '../models/facilities-dto';

@Component({
  selector: 'app-facility-dialog',
  templateUrl: './facility-dialog.component.html',
  styleUrls: ['./facility-dialog.component.scss']
})


export class FacilityDialogComponent {
  selectedFacilities: Set<number> = new Set();
  isIconChecked: boolean = false;
  facilities: FacilitiesDTO[] = [];

  constructor(
    public dialogRef: MatDialogRef<FacilityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {  title: string,details: FacilitiesDTO[] }
  ) {}

  ngOnInit() {
    if (this.data && this.data.details) {
        this.facilities = this.data.details;
        console.log(`Dialog Facilities: ${JSON.stringify(this.facilities, null, 2)}`);
    } else {
        console.error('Facilities data is undefined or not passed correctly.');
    }
}

  toggleSelection(facilityId: number) {
    if (this.selectedFacilities.has(facilityId)) {
      this.selectedFacilities.delete(facilityId);
    } else {
      this.selectedFacilities.add(facilityId);
    }
  }
  toggleCheck() {
    this.isIconChecked = !this.isIconChecked; 
    console.log('Icon Checked:', this.isIconChecked); 
   // this.facilityForm.get('active_in')?.setValue(this.isIconChecked ? 'Y' : 'N'); 
  }
  confirmSelection() {
    this.dialogRef.close(Array.from(this.selectedFacilities));
  }
}
