import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PatientSearchService, WorkQueueItem, WorkQueues } from '../services/patients.service';

interface QueueView {
  key: keyof Omit<WorkQueues, 'counts'>;
  title: string;
  hint: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  loading = true;
  errorMessage = '';
  queues: WorkQueues = {
    outstanding: [],
    billedPartial: [],
    denied: [],
    incomplete: [],
    counts: { outstanding: 0, billedPartial: 0, denied: 0, incomplete: 0 }
  };
  readonly queueViews: QueueView[] = [
    { key: 'outstanding', title: 'Outstanding', hint: 'Unbilled more than 30 days' },
    { key: 'billedPartial', title: 'Billed / Partial', hint: 'Balance remaining' },
    { key: 'denied', title: 'Denied', hint: 'Needs follow-up' },
    { key: 'incomplete', title: 'Incomplete', hint: 'Missing office, provider, CPT, or ICD' }
  ];

  constructor(
    private patientSearchService: PatientSearchService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadQueues();
  }

  loadQueues(): void {
    this.loading = true;
    this.errorMessage = '';
    this.patientSearchService.getWorkQueues().subscribe({
      next: (data) => {
        this.queues = {
          outstanding: data?.outstanding || [],
          billedPartial: data?.billedPartial || [],
          denied: data?.denied || [],
          incomplete: data?.incomplete || [],
          counts: {
            outstanding: data?.counts?.outstanding || 0,
            billedPartial: data?.counts?.billedPartial || 0,
            denied: data?.counts?.denied || 0,
            incomplete: data?.counts?.incomplete || 0
          }
        };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading work queues:', error);
        this.loading = false;
        this.errorMessage = error?.status === 403
          ? 'You do not have access to patient billing.'
          : 'Could not load work queues.';
      }
    });
  }

  rowsFor(key: QueueView['key']): WorkQueueItem[] {
    return this.queues[key] || [];
  }

  countFor(key: QueueView['key']): number {
    return this.queues.counts?.[key] || 0;
  }

  statusClass(status: string): string {
    return 'status-' + String(status || '').toLowerCase();
  }

  extraFor(key: QueueView['key'], row: WorkQueueItem): string {
    if (key === 'outstanding') {
      if (row.age_days == null) {
        return '';
      }
      return row.age_days === 1 ? '1 day' : `${row.age_days} days`;
    }
    if (key === 'billedPartial') {
      return `Bal ${this.formatMoney(row.balance)}`;
    }
    if (key === 'incomplete') {
      return (row.missing || []).join(', ');
    }
    return row.ptn_claim_no ? `Claim ${row.ptn_claim_no}` : '';
  }

  serviceLine(row: WorkQueueItem): string {
    const date = String(row.svc_date || '').trim() || 'No service date';
    const location = this.serviceLocation(row);
    const billed = this.formatMoney(row.billed);
    return `${date} · ${location} · ${billed}`;
  }

  private serviceLocation(row: WorkQueueItem): string {
    const office = String(row.facility_nm || '').trim();
    const provider = String(row.provider_nm || '').trim();
    if (office && provider) {
      return `${office} — ${provider}`;
    }
    return office || provider || 'No office / provider';
  }

  isAging(row: WorkQueueItem): boolean {
    return (row.age_days || 0) > 30;
  }

  openPatient(row: WorkQueueItem): void {
    if (!row?.ptn_id) {
      return;
    }
    this.router.navigate(['/patients'], {
      queryParams: { ptnId: row.ptn_id, svcId: row.svc_id || undefined }
    });
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(value) || 0);
  }
}
