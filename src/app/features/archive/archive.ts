// src/app/features/archive/archive.ts
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, JsonPipe, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Observable } from 'rxjs'; // Не забудьте імпорт Observable
import { FlightService } from '../../core/services/flight.service';
import { ArchivedFlight } from '../../shared/interfaces/archived-flight.interface';
import { AnalyticsResultItem } from '../../shared/interfaces/analytics.interface';

@Component({
  selector: 'app-archive',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, JsonPipe, KeyValuePipe],
  templateUrl: './archive.html',
  styleUrl: './archive.scss'
})
export class ArchiveComponent implements OnInit {
  fromDate = '2025-10-01';
  toDate = '2025-11-30';
  isLoading = false;
  resultMessage = '';
  isSuccess = false;
  archivedList: ArchivedFlight[] = [];

  activeTab: 'archive' | 'analytics' = 'archive';
  analyticsResult: AnalyticsResultItem[] = [];
  queryTitle = '';

  private flightService = inject(FlightService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadArchive();
  }

  runArchive() {
    this.isLoading = true;
    this.resultMessage = '';

    this.flightService.archiveFlights(this.fromDate, this.toDate)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: { success: boolean; count: number }) => {
          this.isSuccess = true;
          this.resultMessage = `✅ Архівовано ${res.count} рейсів!`;
          this.loadArchive();
        },
        error: (err: HttpErrorResponse) => {
          this.isSuccess = false;
          if (err.status === 504) {
             this.resultMessage = '⚠️ Операція тривала довго. Перевірте таблицю.';
             this.loadArchive();
          } else {
             const backendMsg = (err.error && typeof err.error === 'object' && 'error' in err.error) 
                                ? (err.error as { error: string }).error 
                                : err.message;
             this.resultMessage = '❌ Помилка: ' + backendMsg;
          }
          this.cdr.detectChanges();
        }
      });
  }

  loadArchive() {
    this.flightService.getArchivedFlights().subscribe({
        next: (data: ArchivedFlight[]) => {
            this.archivedList = data;
            this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => console.error('Не вдалося завантажити архів:', err.message)
    });
  }

  runAnalytics(type: 'A' | 'B' | 'C') {
    this.analyticsResult = [];
    this.isLoading = true;
    
    if (type === 'C') {
        this.flightService.seedRatings().subscribe();
    }

    // ВИПРАВЛЕНО: Явно вказуємо тип змінної request, щоб TS не плутався
    let request: Observable<AnalyticsResultItem[]>;

    if (type === 'A') {
        this.queryTitle = 'А) Скасовані рейси з Парижа';
        request = this.flightService.runQueryA();
    } else if (type === 'B') {
        this.queryTitle = 'Б) Агрегація: Виторг';
        request = this.flightService.runQueryB();
    } else {
        this.queryTitle = 'В) JOIN: Рейтинги';
        request = this.flightService.runQueryC();
    }

    request.pipe(finalize(() => { 
        this.isLoading = false; 
        this.cdr.detectChanges(); 
    })).subscribe({
        // ВИПРАВЛЕНО: Явна типізація data
        next: (data: AnalyticsResultItem[]) => {
            this.analyticsResult = data;
        },
        error: (err: HttpErrorResponse) => {
            console.error(err);
            this.queryTitle = 'Помилка завантаження';
        }
    });
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  // НОВЕ: Helper для шаблону, щоб KeyValuePipe не сварився на типи
  // Ми кажемо: "Трактуй цей рядок як набір ключів і значень"
  asRecord(row: AnalyticsResultItem): Record<string, unknown> {
    return row as unknown as Record<string, unknown>;
  }
}