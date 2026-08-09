import { Component } from '@angular/core';
import { PdfService } from '../services/pdf.service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import { Patient } from '../models/patient.model';
import { GlobalService } from '../services/global.service';



interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

@Component({
  selector: 'app-pdf',
  template: `<button (click)="generatePDF()">Generate PDF</button>`
})
export class PdfComponent {

  constructor(private pdfService: PdfService,
    private globalService: GlobalService
  ) { }

  generatePDF() {
    this.pdfService.generateSamplePDF();
  }

convertImageToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = function() {
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}


  formatPhoneNumber(phone: string): string {
    if (this.isStringNullOrUndefined(phone)) {
      return '';
    }
    if (phone.length === 10) {
      return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    } else {
      return phone;
    }
  }

  isStringNullOrUndefined(str: string | null | undefined): boolean {
    return str === null || str === undefined;
  }

  formatSSN(ssn: string): string {
    if (this.isStringNullOrUndefined(ssn)) {
      return '';
    } 
    if (ssn.length === 9) {
      return ssn.replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3');
    } else {
      return ssn;
    }
  }

  formatDateToMMDDYYYY(dateString: string): string  {
 
    const date = new Date(dateString);
  
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return ''; // Return null or handle invalid date as needed
    }
  
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are zero-based
    const day = ('0' + date.getDate()).slice(-2);
    const year = date.getFullYear();
  
    return `${month}/${day}/${year}`;
  }


//PATIENT INFO
  static async patientInfo(patient: Patient) {
    const fontSize = 12;
    const lineSpacing = 4;
    const entityImage = sessionStorage.getItem('entityImage') || '';
   console.log('Entity Image:', entityImage);
    const pdfComponent = new PdfComponent(null as any, null as any);

    const base64Image = await pdfComponent.convertImageToBase64(entityImage);

    const doc = new jsPDF() as jsPDFWithAutoTable;
    const companynm = localStorage.getItem('businessEntityName') || ''
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Create instance to use instance methods
    const phoneNumber = pdfComponent.formatPhoneNumber(patient.ptn_mobile_phone);
    const formattedDOB = pdfComponent.formatDateToMMDDYYYY(patient.ptn_date_of_birth);
    const formattedSSN = pdfComponent.formatSSN(patient.ptn_ssn);
    const textWidth = doc.getTextWidth(companynm);
    const textX = (pageWidth - textWidth) / 2;

  console.log(base64Image);
  doc.addImage(base64Image, 'PNG', 10, 10, 30, 30);

  doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.text(companynm, textX, 20);

    doc.setFontSize(10);
    const textWidth1 = doc.getTextWidth('P a t i e n t   I n f o r m a t i o n');
    const textX1 = (pageWidth - textWidth1) / 2;
    doc.text('P a t i e n t   I n f o r m a t i o n', textX1, 30);


  //First Name Last Name
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Patient name: '+patient.ptn_first_nm+' '+patient.ptn_last_nm, 10, 45);
    const ptnNameWidth = doc.getTextWidth('Patient name: '+patient.ptn_first_nm+' '+patient.ptn_last_nm + ' ');
    doc.line(10 + doc.getTextWidth('Patient name: '), 46, 11 + ptnNameWidth, 46);

    doc.setFontSize(10);
    doc.text('Address: '+ patient.ptn_address, 16, 55);
    const addrWidth = doc.getTextWidth('Address: '+ patient.ptn_address + '  ');
    doc.line(16 + doc.getTextWidth('Address: '), 56, 16 + doc.getTextWidth('Address: '+patient.ptn_address + '  '), 56);

    doc.text('City: '+ patient.ptn_city, 16 + addrWidth, 55);
    const cityWidth = doc.getTextWidth('City: '+ patient.ptn_city + '  ');
    const cityLineX = 16 + doc.getTextWidth('Address: '+patient.ptn_address + '  '+'City: ');
    const cityLineX2 = cityLineX + doc.getTextWidth(patient.ptn_city + '  ');
    doc.line(cityLineX, 56, cityLineX2, 56);
 
    doc.text('State: '+patient.ptn_state, 16 + addrWidth + cityWidth, 55);
    const stateWidth = doc.getTextWidth('State: '+patient.ptn_state + '  ');
    const statepLineX = 16 + addrWidth + cityWidth + doc.getTextWidth('State: ');
    const stateLineX2 = statepLineX + 6;
    doc.line(statepLineX, 56,stateLineX2 , 56);

    doc.text('Zip: '+patient.ptn_zip, 16 + addrWidth + cityWidth + stateWidth, 55);
    const zipLineX = 16 + addrWidth + cityWidth + stateWidth + doc.getTextWidth('Zip: ');
    const zipLineX2 = zipLineX + doc.getTextWidth(patient.ptn_zip + ' ');
    doc.line(zipLineX, 56,zipLineX2 , 56);

    doc.text('Phone: ',19, 60);  
    doc.text(phoneNumber,19 + doc.getTextWidth('Phone: '), 60);  
    const phoneWidth = doc.getTextWidth('Phone: '+phoneNumber + '        ');
    const phoneLineX = 19 + doc.getTextWidth('Phone: ');
    const phoneLineX2 = phoneLineX + doc.getTextWidth('(999) 999-9999');
    doc.line(phoneLineX, 61,phoneLineX2 , 61);

    doc.text('Date of Birth: ',10, 65);  
    doc.text(formattedDOB,10 + doc.getTextWidth('Date of Birth: '), 65); 
    const dobLineX = 10 + doc.getTextWidth('Date of Birth: ');
    const dobLineX2 = dobLineX + doc.getTextWidth('01/01/1990');
    doc.line(dobLineX, 66,phoneLineX2 , 66);

    doc.text('SSN: ',22, 70);  
    doc.text(formattedSSN,22 + doc.getTextWidth('SSN: '), 70);  
    const ssnLineX = 22 + doc.getTextWidth('SSN: ');
    const ssnLineX2 = ssnLineX + doc.getTextWidth('999-99-9999');
    doc.line(ssnLineX, 71,phoneLineX2 , 71);

    doc.line(10, 81, 190, 81);
    doc.line(10, 81, 10, 105);
    doc.line(190, 81, 190, 105);
    doc.line(10, 105, 190, 105);
// Line 3: Courier, Italic, Size 14
    // Add text

    doc.setFontSize(10);
    doc.text('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis fermentum dolor risus, sed fermentum mi ullamcorper sed. Morbi semper viverra arcu, vitae faucibus quam iaculis eget. Vivamus aliquet felis in faucibus hendrerit. Duis condimentum nunc lectus, non pharetra sapien vestibulum quis. Duis malesuada ac nisl at pulvinar. Proin libero ex, consectetur id nunc non, sollicitudin tempor elit. Donec suscipit odio a lorem euismod, ac finibus nibh dapibus. Nunc consequat non purus vel porttitor.', 11, 85, { maxWidth: 178 });
   /*
    doc.autoTable({ 
      startY: 100,
      margin: { left: 10 },
      head: [['First Name', 'Last Name', 'Age']], 
      body: [['John', 'Doe', 30], ['Jane', 'Smith', 25]] ,
            headStyles: {
        fillColor: [255, 255, 255], // Background color (RGB)
        textColor: [255, 0, 0], // Text color (RGB)
      }
    });
    */  
   //bottom line 
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Patient ID: '+patient.ptn_id, 10, pageHeight - 5);
      // Save the PDF
    doc.save('patient_'+patient.ptn_id+'.pdf'); 
  }
  
 
}
