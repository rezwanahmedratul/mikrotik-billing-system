import { SmsAdapter, SmsSendRequest, SmsSendResult } from './sms.interface';
import { SmsStatus } from './index';

export class MockSmsAdapter implements SmsAdapter {
  readonly provider: string = 'MOCK_SMS_GATEWAY';
  public sentMessages: (SmsSendRequest & { messageId: string; sentAt: Date })[] = [];
  private shouldFail = false;
  private failureError = 'Simulated SMS provider gateway timeout';

  setSimulateFailure(shouldFail: boolean, errorMsg?: string) {
    this.shouldFail = shouldFail;
    if (errorMsg) this.failureError = errorMsg;
  }

  clearHistory() {
    this.sentMessages = [];
    this.shouldFail = false;
  }

  async sendSms(req: SmsSendRequest): Promise<SmsSendResult> {
    if (this.shouldFail) {
      return {
        success: false,
        messageId: `msg-failed-${Date.now()}`,
        provider: this.provider,
        status: SmsStatus.FAILED,
        error: this.failureError,
        providerResponseCode: 'ERR_SIMULATED_FAIL',
      };
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.sentMessages.push({
      ...req,
      messageId,
      sentAt: new Date(),
    });

    return {
      success: true,
      messageId,
      provider: this.provider,
      status: SmsStatus.DELIVERED,
      providerResponseCode: '1000_SUCCESS',
    };
  }

  async queryDeliveryStatus(messageId: string): Promise<SmsStatus> {
    const found = this.sentMessages.find((m) => m.messageId === messageId);
    return found ? SmsStatus.DELIVERED : SmsStatus.FAILED;
  }
}
