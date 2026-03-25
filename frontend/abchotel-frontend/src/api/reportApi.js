import axiosClient from './axiosClient';

export const reportApi = {
  getAuditLogs: (params) => axiosClient.get('/Reports/audit-logs', { params }),
  getStaffPerformance: (params) => axiosClient.get('/Reports/staff-performance', { params })
};