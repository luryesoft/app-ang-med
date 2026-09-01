import { Component } from '@angular/core';
import { PdfService } from '../services/pdf.service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import { Patient } from '../models/patient.model';
import { GlobalService } from '../services/global.service';
import { DiagnosisCode, PatientService } from '../models/patient-service.model';
import { parseMoney } from '../pipes/numeric-only.directive';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
  lastAutoTable?: { finalY: number };
}

export interface PatientChartPdfContext {
  patient: Patient;
  companyName: string;
  insuranceName: string;
  lawyerName: string;
  diagnoses: DiagnosisCode[];
  services: PatientService[];
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
        resolve(canvas.toDataURL('image/png'));
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
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) {
      return digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    return phone || '';
  }

  isStringNullOrUndefined(str: string | null | undefined): boolean {
    return str === null || str === undefined || str === '';
  }

  formatSSN(ssn: string): string {
    if (this.isStringNullOrUndefined(ssn)) {
      return '';
    }
    const digits = String(ssn).replace(/\D/g, '');
    if (digits.length >= 4) {
      return `***-**-${digits.slice(-4)}`;
    }
    return '';
  }

  formatDateToMMDDYYYY(dateString: string): string  {
    if (!dateString) {
      return '';
    }
    const raw = String(dateString).trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      return raw;
    }
    const date = new Date(raw);
    if (isNaN(date.getTime())) {
      return raw;
    }
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${month}/${day}/${date.getFullYear()}`;
  }

  static async patientInfo(context: Patient | PatientChartPdfContext) {
    const chart = PdfComponent.normalizeContext(context);
    const patient = chart.patient;
    const helper = new PdfComponent(null as any, null as any);
    const doc = new jsPDF({ unit: 'mm', format: 'letter' }) as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 12;
    const right = pageWidth - 12;
    const usable = right - left;
    const navy: [number, number, number] = [35, 92, 214];
    const slate: [number, number, number] = [55, 65, 81];

    const money = (value: unknown) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseMoney(value) || 0);

    const lineTotal = (amount: unknown, units: unknown) =>
      (parseMoney(amount) || 0) * (Number(units) || 1);

    const serviceBilled = (svc: PatientService) =>
      (svc.lines || []).reduce((sum, line) => sum + lineTotal(line.amount, line.units), 0);

    const servicePaid = (svc: PatientService) =>
      (svc.payments || []).reduce((sum, pay) => sum + (parseMoney(pay.amount) || 0), 0);

    const billedTotal = chart.services.reduce((sum, svc) => sum + serviceBilled(svc), 0);
    const paidTotal = chart.services.reduce((sum, svc) => sum + servicePaid(svc), 0);
    const balanceTotal = billedTotal - paidTotal;

    const patientName = [patient.ptn_first_nm, patient.ptn_mid_init, patient.ptn_last_nm]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const logo = await PdfComponent.loadLogo(helper);
    const company = chart.companyName || localStorage.getItem('businessEntityName') || '';
    const printed = helper.formatDateToMMDDYYYY(new Date().toISOString());

    if (logo) {
      try {
        doc.addImage(logo, 'PNG', left, 8, 16, 16);
      } catch {
        // skip a broken logo so the chart still prints
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...navy);
    doc.text(company || 'Patient Chart', logo ? left + 20 : left, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...slate);
    doc.text('Patient Chart  ·  CPT, ICD & Payments', logo ? left + 20 : left, 20);

    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Printed ${printed}`, right, 14, { align: 'right' });
    doc.text(patient.ptn_id ? `Patient ID ${patient.ptn_id}` : '', right, 19, { align: 'right' });

    doc.setDrawColor(...navy);
    doc.setLineWidth(0.5);
    doc.line(left, 27, right, 27);

    let y = 32;
    const nextY = () => (doc.lastAutoTable?.finalY || y) + 5;

    const drawSection = (title: string) => {
      if (y > pageHeight - 28) {
        doc.addPage();
        y = 14;
      }
      doc.setFillColor(35, 92, 214);
      doc.rect(left, y, usable, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(title, left + 2, y + 4.2);
      y += 8;
    };

    const kvTable = (body: string[][], startY: number) => {
      doc.autoTable({
        startY,
        margin: { left, right: 12 },
        tableWidth: usable,
        theme: 'plain',
        showHead: 'never',
        styles: { fontSize: 8, cellPadding: 1.2, textColor: slate, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 28, fontStyle: 'bold', textColor: [75, 85, 99] },
          2: { cellWidth: 28, fontStyle: 'bold', textColor: [75, 85, 99] }
        },
        body
      });
    };

    drawSection('Patient');
    const address = [patient.ptn_address, [patient.ptn_city, patient.ptn_state].filter(Boolean).join(', '), patient.ptn_zip]
      .filter(Boolean)
      .join('  ');
    kvTable(
      [
        ['Name', patientName || '—', 'DOB', helper.formatDateToMMDDYYYY(patient.ptn_date_of_birth) || '—'],
        ['Sex', patient.ptn_sex || '—', 'SSN', helper.formatSSN(patient.ptn_ssn) || '—'],
        ['Home phone', helper.formatPhoneNumber(patient.ptn_home_phone) || '—', 'Mobile', helper.formatPhoneNumber(patient.ptn_mobile_phone) || '—'],
        ['Address', address || '—', 'Status', patient.ptn_active_flag === 'N' ? 'Inactive' : 'Active'],
        ['Occupation', patient.ptn_occupation || '—', 'Comments', patient.ptn_comments || '—']
      ],
      y
    );
    y = nextY();

    drawSection('Insurance & Claim');
    kvTable(
      [
        ['Insurance', chart.insuranceName || '—', 'Lawyer', chart.lawyerName || '—'],
        ['Provider', company || '—', 'Accident', helper.formatDateToMMDDYYYY(patient.ptn_date_of_accident || '') || '—'],
        ['Policy #', patient.ptn_policy_no || '—', 'Claim #', patient.ptn_claim_no || '—'],
        ['Policyholder', patient.ptn_policyholder || '—', '', '']
      ],
      y
    );
    y = nextY();

    drawSection('ICD Diagnoses');
    if (!chart.diagnoses.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('No ICD codes assigned.', left, y + 2);
      y += 8;
    } else {
      doc.autoTable({
        startY: y,
        margin: { left, right: 12 },
        tableWidth: usable,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.4, textColor: slate, lineColor: [226, 232, 240], lineWidth: 0.15 },
        headStyles: { fillColor: navy, textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { cellWidth: 32 }, 2: { cellWidth: 'auto' } },
        head: [['#', 'ICD', 'Description']],
        body: chart.diagnoses.map((dx, index) => [
          String(index + 1),
          dx.icd_code || '',
          dx.description || ''
        ])
      });
      y = nextY();
    }

    drawSection('Services  ·  CPT & Payments');
    if (!chart.services.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('No services recorded.', left, y + 2);
      y += 8;
    }

    chart.services.forEach((svc, index) => {
      if (y > pageHeight - 42) {
        doc.addPage();
        y = 14;
      }
      const billed = serviceBilled(svc);
      const paid = servicePaid(svc);
      const office = svc.facility_nm || '';
      const provider = svc.provider_nm || '';
      const location = [office, provider].filter(Boolean).join('  ·  ') || 'No treating office / provider';

      doc.setFillColor(241, 245, 249);
      doc.rect(left, y, usable, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...navy);
      doc.text(
        `Service ${index + 1}   ${helper.formatDateToMMDDYYYY(svc.svc_date) || '—'}   ${svc.status || ''}`,
        left + 2,
        y + 5
      );
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...slate);
      doc.text(
        `Billed ${money(billed)}   Paid ${money(paid)}   Balance ${money(billed - paid)}`,
        right - 2,
        y + 5,
        { align: 'right' }
      );
      y += 11;

      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      doc.text(location, left + 2, y);
      y += 4;
      if (svc.notes) {
        doc.setFont('helvetica', 'italic');
        doc.text(`Notes: ${svc.notes}`, left + 2, y, { maxWidth: usable - 4 });
        y += 5;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...navy);
      doc.text('CPT', left + 2, y);
      y += 2;

      const cptRows = (svc.lines || []).map((line) => [
        line.cpt_code || '',
        line.modifier || '',
        line.description || '',
        String(Number(line.units) || 1),
        money(line.amount),
        money(lineTotal(line.amount, line.units))
      ]);
      doc.autoTable({
        startY: y,
        margin: { left, right: 12 },
        tableWidth: usable,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.3, textColor: slate, lineColor: [226, 232, 240], lineWidth: 0.15 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 16 },
          3: { cellWidth: 16, halign: 'right' },
          4: { cellWidth: 24, halign: 'right' },
          5: { cellWidth: 24, halign: 'right' }
        },
        head: [['CPT', 'Mod', 'Description', 'Units', 'Charge', 'Total']],
        body: cptRows.length ? cptRows : [['—', '', 'No CPT lines', '', '', '']]
      });
      y = nextY();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...navy);
      doc.text('Payments', left + 2, y);
      y += 2;

      const payRows = (svc.payments || []).map((pay) => [
        helper.formatDateToMMDDYYYY(pay.pay_date) || '',
        pay.method || '',
        pay.reference || '',
        money(pay.amount)
      ]);
      doc.autoTable({
        startY: y,
        margin: { left, right: 12 },
        tableWidth: usable,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.3, textColor: slate, lineColor: [226, 232, 240], lineWidth: 0.15 },
        headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 32 },
          3: { cellWidth: 28, halign: 'right' }
        },
        head: [['Date', 'Method', 'Reference', 'Amount']],
        body: payRows.length ? payRows : [['—', '', 'No payments', '']]
      });
      y = nextY() + 2;
    });

    if (y > pageHeight - 32) {
      doc.addPage();
      y = 14;
    }
    drawSection('Totals');
    doc.autoTable({
      startY: y,
      margin: { left, right: 12 },
      tableWidth: usable,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 1.6, textColor: slate, lineColor: [226, 232, 240], lineWidth: 0.15 },
      headStyles: { fillColor: navy, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { halign: 'right' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' }
      },
      head: [['Services', 'Billed', 'Paid', 'Balance']],
      body: [[
        String(chart.services.length),
        money(billedTotal),
        money(paidTotal),
        money(balanceTotal)
      ]]
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(left, pageHeight - 10, right, pageHeight - 10);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Patient ID: ${patient.ptn_id || ''}   ${patientName}`,
        left,
        pageHeight - 6
      );
      doc.text(`Page ${i} of ${pageCount}`, right, pageHeight - 6, { align: 'right' });
    }

    const fileName = PdfComponent.chartFileName(patient);
    doc.save(fileName);
  }

  private static chartFileName(patient: Patient): string {
    const last = PdfComponent.safeFilePart(patient.ptn_last_nm);
    const first = PdfComponent.safeFilePart(patient.ptn_first_nm);
    const id = patient.ptn_id || 'chart';
    return [last, first, id].filter((part) => part !== '' && part != null).join('_') + '.pdf';
  }

  private static safeFilePart(value: unknown): string {
    return String(value ?? '')
      .trim()
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '');
  }

  private static normalizeContext(context: Patient | PatientChartPdfContext): PatientChartPdfContext {
    if (context && 'patient' in context) {
      return {
        patient: context.patient,
        companyName: context.companyName || '',
        insuranceName: context.insuranceName || '',
        lawyerName: context.lawyerName || '',
        diagnoses: context.diagnoses || [],
        services: context.services || []
      };
    }
    return {
      patient: context,
      companyName: '',
      insuranceName: '',
      lawyerName: '',
      diagnoses: [],
      services: []
    };
  }

  private static async loadLogo(helper: PdfComponent): Promise<string> {
    const entityImage = sessionStorage.getItem('entityImage') || '';
    if (!entityImage) {
      return '';
    }
    if (entityImage.startsWith('data:')) {
      return entityImage;
    }
    try {
      return await helper.convertImageToBase64(entityImage);
    } catch {
      return '';
    }
  }
}
