import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter?: Transporter;
  constructor(private readonly config: ConfigService) {
    const smtp = this.config.get<{
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password: string;
      from: string;
    }>('app.smtp');
    if (smtp?.host && smtp.user && smtp.password && smtp.from)
      this.transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: { user: smtp.user, pass: smtp.password },
      });
  }
  async sendOtp(to: string, code: string): Promise<void> {
    if (!this.transporter)
      throw new ServiceUnavailableException({
        code: 'MAIL_NOT_CONFIGURED',
        message: 'El acceso por correo aún no está configurado.',
      });
    await this.transporter.sendMail({
      from: this.config.get<string>('app.smtp.from'),
      to,
      subject: 'Tu código para Moon',
      text: `Tu código para Moon es ${code}. Vence en 5 minutos.`,
      html: `<p>Tu código para Moon es:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Vence en 5 minutos. No lo compartas con nadie.</p>`,
    });
  }
}
