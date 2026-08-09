import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

@Injectable({
  providedIn: 'root' // Makes the service available application-wide
})
export class PdfService {

  constructor() { }

  generateSamplePDF() {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    doc.setFontSize(12);
    doc.text('This is a sample PDF.', 10, 10);
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
    doc.save('sample.pdf');
  }


}