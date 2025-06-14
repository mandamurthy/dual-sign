// auditLogApi.ts - API client for audit log operations
const API_BASE = 'http://localhost:3001/api';

export interface AuditLogPayload {
  auditPath: string;
  auditCaptureApproach: string;
  projectName: string;
  environment: string;
  fileName: string;
  maker: string;
  makerComment: string;
  checker: string;
  checkerComment: string;
  checkAction: string;
  diffText: string;
  auditRetentionDays: number;
  timestamp: string;
}

export async function postAuditLog(payload: AuditLogPayload): Promise<void> {
  console.debug('[AuditLog][DEBUG][FRONTEND] Payload to be sent:', payload);
  
  const resp = await fetch(`${API_BASE}/audit-log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error('Audit log write failed: ' + (await resp.text()));
}
