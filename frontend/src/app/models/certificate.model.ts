export interface HcsInfo {
  sequenceNumber: string;
  transactionId: string;
  topicId: string;
  timestamp: string;
}

export interface IssueResponse {
  success: boolean;
  certId: string;
  fileHash: string;
  hcs: HcsInfo;
  message: string;
}

export interface CertificateRecord {
  type: string;
  version: string;
  certId: string;
  institution: string;
  recipientName: string;
  courseName: string;
  issueDate: string;
  fileHash: string;
  consensusTimestamp: string;
  sequenceNumber: string;
  topicId: string;
}

export interface VerifyResponse {
  verified: boolean;
  hashMatch?: boolean;
  certificate?: CertificateRecord;
  message?: string;
}
