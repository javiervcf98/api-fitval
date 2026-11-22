import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsInt,
  IsString,
  Length,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

// Quita los espacios de los lados si llega un texto
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateTrainerDto {
  @Transform(trim)
  @IsString()
  @Length(9, 9) // 9 caracteres exactos, como VARCHAR(9)
  dni!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @IsArray()
  @ArrayMinSize(1) // al menos una especialidad
  @ArrayUnique() // sin repetir: [2, 2] → 400
  @IsInt({ each: true }) // cada elemento, un entero...
  @Min(1, { each: true }) // ...mayor que 0
  specialtyIds!: number[];
}
