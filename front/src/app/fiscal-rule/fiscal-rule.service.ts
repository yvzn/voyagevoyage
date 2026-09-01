import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FiscalRule, CreateFiscalRuleRequest, UpdateFiscalRuleRequest } from './fiscal-rule.model';

@Injectable({
  providedIn: 'root'
})
export class FiscalRuleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/fiscal-rules';

  getFiscalRules(): Observable<FiscalRule[]> {
    return this.http.get<FiscalRule[]>(this.apiUrl);
  }

  createFiscalRule(request: CreateFiscalRuleRequest): Observable<FiscalRule> {
    return this.http.post<FiscalRule>(this.apiUrl, request);
  }

  updateFiscalRule(id: string, request: UpdateFiscalRuleRequest): Observable<FiscalRule> {
    return this.http.put<FiscalRule>(`${this.apiUrl}/${id}`, request);
  }

  deleteFiscalRule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
