import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';
import { LoginResponse, Project, DailyTimeEntry, DailyEquipmentEntry, DailyMaterialEntry, ActivityLog } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use((config) => {
      const { token } = useAuth.getState();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor to handle 401 (clear auth on token expiry)
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          useAuth.getState().clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== AUTH ====================

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  // ==================== PROJECTS ====================

  async getProjects(
    divisionId?: string,
    status?: 'active' | 'completed' | 'all',
    limit?: number,
    offset?: number
  ) {
    const params: any = {};
    if (divisionId) params.division_id = divisionId;
    if (status) params.status = status;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;

    const response = await this.client.get('/projects', { params });
    return response.data;
  }

  async getProjectById(projectId: string) {
    const response = await this.client.get(`/projects/${projectId}`);
    return response.data;
  }

  async createProject(data: any) {
    const response = await this.client.post('/projects', data);
    return response.data;
  }

  // ==================== PROJECT SETUP ====================

  async addBillingLines(projectId: string, lines: any[]) {
    const response = await this.client.post(
      `/projects/${projectId}/setup/billing-lines`,
      { lines }
    );
    return response.data;
  }

  async addCostCodes(projectId: string, costCodes: any[]) {
    const response = await this.client.post(
      `/projects/${projectId}/setup/cost-codes`,
      { cost_codes: costCodes }
    );
    return response.data;
  }

  async assignEmployees(projectId: string, employeeIds: string[]) {
    const response = await this.client.post(
      `/projects/${projectId}/setup/employees`,
      { employee_ids: employeeIds }
    );
    return response.data;
  }

  async addEquipment(projectId: string, equipment: any[]) {
    const response = await this.client.post(
      `/projects/${projectId}/setup/equipment`,
      { equipment }
    );
    return response.data;
  }

  async copyPositionRates(fromProjectId: string, toProjectId: string) {
    const response = await this.client.post(
      `/projects/${toProjectId}/setup/copy-rates`,
      { from_project_id: fromProjectId }
    );
    return response.data;
  }

  // ==================== DAILY ENTRIES ====================

  async saveTimeEntry(projectId: string, data: any) {
    const response = await this.client.post(
      `/projects/${projectId}/daily-entries/time`,
      data
    );
    return response.data;
  }

  async saveEquipmentEntry(projectId: string, data: any) {
    const response = await this.client.post(
      `/projects/${projectId}/daily-entries/equipment`,
      data
    );
    return response.data;
  }

  async saveMaterialEntry(projectId: string, data: any) {
    const response = await this.client.post(
      `/projects/${projectId}/daily-entries/material`,
      data
    );
    return response.data;
  }

  async getEntries(
    projectId: string,
    dateFrom?: string,
    dateTo?: string,
    type?: string
  ) {
    const params: any = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (type) params.entry_type = type;

    const response = await this.client.get(
      `/projects/${projectId}/daily-entries`,
      { params }
    );
    return response.data;
  }

  async getDailySummary(projectId: string, date: string) {
    const response = await this.client.get(
      `/projects/${projectId}/daily-entries/summary`,
      { params: { date } }
    );
    return response.data;
  }

  // ==================== BUDGET ====================

  async getProjectBudget(projectId: string) {
    const response = await this.client.get(
      `/projects/${projectId}/budget/cost-codes`
    );
    return response.data;
  }

  async getClientBudget(clientId: string) {
    const response = await this.client.get(`/clients/${clientId}/budget`);
    return response.data;
  }

  async getDivisionDashboard(divisionId: string) {
    const response = await this.client.get(
      `/divisions/${divisionId}/dashboard`
    );
    return response.data;
  }

  // ==================== ACTIVITY LOG ====================

  async addActivityLog(projectId: string, data: any) {
    const response = await this.client.post(
      `/projects/${projectId}/activity-log`,
      data
    );
    return response.data;
  }

  async getActivityLog(projectId: string, limit?: number, offset?: number) {
    const params: any = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;

    const response = await this.client.get(
      `/projects/${projectId}/activity-log`,
      { params }
    );
    return response.data;
  }

  // ==================== EXPORT ====================

  async exportToJonasCSV(projectId: string, dateFrom: string, dateTo: string) {
    const response = await this.client.post(
      `/projects/${projectId}/export/jonas`,
      { date_from: dateFrom, date_to: dateTo },
      { responseType: 'blob' }
    );
    return response.data;
  }

  async exportToDailyLEMCSV(projectId: string, dateFrom: string, dateTo: string) {
    const response = await this.client.post(
      `/projects/${projectId}/export/lem`,
      { date_from: dateFrom, date_to: dateTo },
      { responseType: 'blob' }
    );
    return response.data;
  }

  // ==================== EMPLOYEES & RATES ====================

  async getCompanyEmployees() {
    const response = await this.client.get('/employees');
    return response.data;
  }

  async getPositionRates(companyId: string) {
    const response = await this.client.get(`/position-rates?company_id=${companyId}`);
    return response.data;
  }

  // ==================== ERROR HANDLING ====================

  getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.error) {
        return error.response.data.error;
      }
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}

export const api = new ApiClient();
