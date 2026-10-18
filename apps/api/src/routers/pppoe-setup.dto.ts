export interface PppoeSetupInspectionResult {
  routerId: string;
  routerName: string;
  isOnline: boolean;
  interfaces: Array<{ name: string; type: string; running: boolean }>;
  existingPools: Array<{ name: string; ranges: string }>;
  existingProfiles: Array<{ name: string; rateLimit?: string }>;
  existingServers: Array<{ serviceName: string; interfaceName: string }>;
  prerequisites: {
    hasRunningInterface: boolean;
    hasExistingPool: boolean;
    hasExistingServer: boolean;
    readyForSetup: boolean;
    warnings: string[];
  };
}

export interface PppoeSetupPlanDto {
  serviceName: string;
  interfaceName: string;
  poolName: string;
  poolRange: string;
  localAddress: string;
  dnsServers?: string;
  defaultProfileName: string;
}

export interface PppoeSetupPlanResult {
  planId: string;
  routerId: string;
  createdAt: string;
  parameters: PppoeSetupPlanDto;
  steps: Array<{
    stepNumber: number;
    action: string;
    target: string;
    details: string;
    isNew: boolean;
  }>;
  safetyCheck: {
    touchesWan: false;
    touchesFirewall: false;
    touchesRouting: false;
    isSafe: true;
  };
}

export interface PppoeSetupApplyDto extends PppoeSetupPlanDto {
  confirmed: boolean;
  planId?: string;
}

export interface PppoeSetupApplyResult {
  success: boolean;
  jobId: string;
  routerId: string;
  status: string;
  appliedSteps: string[];
  postVerification: {
    verifiedPool: boolean;
    verifiedProfile: boolean;
    verifiedServer: boolean;
    allPassed: boolean;
  };
  error?: string;
}
