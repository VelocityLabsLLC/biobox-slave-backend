import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNotEmpty } from 'class-validator';

const commonProps = {
  required: true,
};

export class DevicedataDto {
  @IsNotEmpty()
  @ApiProperty(commonProps)
  trialSubjectId: string;

  @IsNotEmpty()
  @ApiProperty(commonProps)
  deviceId: string;

  @IsNotEmpty()
  @ApiProperty(commonProps)
  trialDuration: number;

  @IsNotEmpty()
  @ApiProperty(commonProps)
  frequency: number;

  @IsNotEmpty()
  @ApiProperty(commonProps)
  experimentId: string;

  @IsNotEmpty()
  @ApiProperty(commonProps)
  trialId: string;

  @IsNotEmpty()
  @ApiProperty(commonProps)
  phases: Array<any>;

  @IsNotEmpty()
  @ApiProperty(commonProps)
  subjectId: string;

  @IsOptional()
  @ApiProperty()
  deviceTimeRemaining: string;
}
