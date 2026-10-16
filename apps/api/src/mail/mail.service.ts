import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend?: Resend;
  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('app.resend.apiKey');
    if (apiKey) this.resend = new Resend(apiKey);
  }
  async sendOtp(to: string, code: string): Promise<void> {
    const from = this.config.get<string>('app.resend.from');
    if (!this.resend || !from)
      throw new ServiceUnavailableException({
        code: 'RESEND_NOT_CONFIGURED',
        message: 'El envío de correo aún no está configurado.',
      });
    try {
      const { error } = await this.resend.emails.send({
        from,
        to,
        subject: 'Tu código para Moon',
        text: `Tu código para Moon es ${code}. Vence en 5 minutos.`,
        html: `<p>Tu código para Moon es:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Vence en 5 minutos. No lo compartas con nadie.</p>`,
      });
      if (!error) return;
    } catch {
      // The public error must not reveal provider or network internals.
    }
    throw new ServiceUnavailableException({
      code: 'EMAIL_DELIVERY_FAILED',
      message: 'No pudimos enviar el código. Intenta de nuevo en unos minutos.',
    });
  }
}
