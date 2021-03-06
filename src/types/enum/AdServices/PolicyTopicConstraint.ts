export namespace PolicyTopicConstraint {
  export enum PolicyTopicConstraintType {
    UNKNOWN = 'UNKNOWN',
    COUNTRY = 'COUNTRY',
    RESELLER = 'RESELLER',
    CERTIFICATE_MISSING_IN_COUNTRY = 'CERTIFICATE_MISSING_IN_COUNTRY',
    CERTIFICATE_DOMAIN_MISMATCH_IN_COUNTRY = 'CERTIFICATE_DOMAIN_MISMATCH_IN_COUNTRY',
    CERTIFICATE_MISSING = 'CERTIFICATE_MISSING',
    CERTIFICATE_DOMAIN_MISMATCH = 'CERTIFICATE_DOMAIN_MISMATCH',
  }
}
