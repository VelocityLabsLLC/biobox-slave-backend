import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class TrialMetaDto {
  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'trialSubjectId',
    example: 1,
  })
  trialSubjectId: string;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'experiment id',
    example: 1,
  })
  experimentId: string;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'device id',
    example: 1,
  })
  deviceId: string;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'trial id',
    example: 1,
  })
  trialId: string;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'Name of the phase.',
    example: 1,
  })
  phases: Array<any>;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'subject id',
    example: 1,
  })
  subjectId: string;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'Data frequency.',
    example: 1,
  })
  frequency: number;

  @IsOptional()
  @ApiProperty({
    required: true,
    description: 'Mac Address of master device.',
    example: '50:6a:10:E3:1S:69',
  })
  masterMacAddress: string;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'Trial Duration',
    example: 10,
  })
  trialDuration: number;

  @IsOptional()
  @ApiProperty({
    description: 'Tag for global search.',
    example: 'TAG1',
  })
  tags: string;
}

export class ResetDataDto {
  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'device id',
    example: 1,
  })
  deviceId: string;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'trial id',
    example: 1,
  })
  trialId: string;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'subject id',
    example: 1,
  })
  subjectId: string;
}

export class GroupedDataDto {
  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'Trial Id',
    example: '3bd2a7a3-0aa9-4ee3-95e3-df135f8df409',
  })
  trialId: string;

  @IsOptional()
  @ApiProperty({
    description: 'Device Id',
    example: '3bd2a7a3-0aa9-4ee3-95e3-df135f8df409',
  })
  deviceId: string;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'Subject Id',
    example: '3bd2a7a3-0aa9-4ee3-95e3-df135f8df409',
  })
  subjectId: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'Data to fetch at interval',
    example: 5,
  })
  interval: number = 5;
}

export class UpdateTrialsubjectDto {
  @IsOptional()
  @ApiProperty({
    required: true,
    description: 'Id of the trial.',
    example: { id: '1' },
  })
  trial: { id: string };

  @IsOptional()
  @ApiProperty({
    required: true,
    description: 'Id of the subject.',
    example: { id: '1' },
  })
  subject: { id: string };

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'Id of the device.',
    example: { id: '1' },
  })
  device: { id: string };

  @IsOptional()
  @ApiProperty({
    // required: true,
    description: 'Status of Trial_Subject',
    example: 'Active',
  })
  status: string;

  @IsOptional()
  @ApiProperty({
    // required: true,
    description: 'Treatment of subject',
    example: 'Control',
  })
  treatment: string;

  @IsOptional()
  @ApiProperty({
    // required: true,
    description: 'Order of subject',
    example: 1,
  })
  order: number;

  @IsOptional()
  @ApiProperty({
    // required: true,
    description: 'Notes',
    example: '',
  })
  notes: string;

  @IsOptional()
  @ApiProperty({
    // required: true,
    description: '1',
    example: '',
  })
  name: string;

  @IsOptional()
  @ApiProperty({
    description: 'Tag for global search.',
    example: 'TAG1',
  })
  tags: string;

  @IsOptional()
  protocolName: string;

  @IsOptional()
  masterName: string;

  @IsOptional()
  MasterMacAddress: string;

  @IsOptional()
  slaveName: string;

  @IsOptional()
  slaveMacAddress: string;
}
