import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  email!: string;
}
export class VerifyOtpDto {
  @IsString() @IsNotEmpty() challengeId!: string;
  @Matches(/^\d{6}$/) code!: string;
}
