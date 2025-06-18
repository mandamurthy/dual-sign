// elasticClient.js
// ElasticSearch client setup for audit log indexing and search

import { Client } from '@elastic/elasticsearch';

// Connect to ElasticSearch via HTTPS with basic auth and accept self-signed certs
export const elasticClient = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic', // Replace with your actual username if different
    password: 'mfzNmy2C4uU_HTs6Swtd' // Replace with your actual password from ElasticSearch startup logs
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certs for local dev
  }
});

export const AUDIT_LOG_INDEX = 'audit_logs';

// Helper to ensure the index exists (idempotent)
export async function ensureAuditLogIndex() {
  const exists = await elasticClient.indices.exists({ index: AUDIT_LOG_INDEX });
  if (!exists) {
    await elasticClient.indices.create({
      index: AUDIT_LOG_INDEX,
      body: {
        mappings: {
          properties: {
            project_name: { type: 'keyword' },
            environment: { type: 'keyword' },
            file_name: { type: 'keyword' },
            timestamp: { type: 'date', format: 'yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis||strict_date_optional_time' },
            maker: { type: 'keyword' },
            maker_comment: { type: 'text' },
            checker: { type: 'keyword' },
            checker_comment: { type: 'text' },
            check_action: { type: 'keyword' },
            diff_text: { type: 'text' },
          }
        }
      }
    });
  }
}
