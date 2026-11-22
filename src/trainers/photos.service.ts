import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const UPLOADS_DIR = join(process.cwd(), 'uploads');

// Los primeros bytes de cada formato (su "firma"). No nos fiamos de la extensión
function detectImageType(buffer: Buffer): 'png' | 'jpg' | null {
  const isPng =
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 && // P
    buffer[2] === 0x4e && // N
    buffer[3] === 0x47; // G
  if (isPng) return 'png';

  const isJpg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;
  if (isJpg) return 'jpg';

  return null;
}

@Injectable()
export class PhotosService {
  // Comprueba la foto, la guarda en uploads/ y devuelve su dirección
  async save(file: Express.Multer.File | undefined): Promise<string> {
    if (!file) {
      throw new BadRequestException('Falta la foto (campo "photo")'); // → 400
    }

    if (file.size > MAX_SIZE) {
      throw new BadRequestException('La foto no puede pesar más de 2 MB'); // → 400
    }

    const type = detectImageType(file.buffer);
    if (!type) {
      throw new BadRequestException('Solo se admiten imágenes PNG o JPG'); // → 400
    }

    // Un nombre aleatorio: nunca usamos el que manda el cliente
    const fileName = `${randomUUID()}.${type}`;

    await mkdir(UPLOADS_DIR, { recursive: true }); // crea uploads/ si no existe
    await writeFile(join(UPLOADS_DIR, fileName), file.buffer);

    return `/uploads/${fileName}`;
  }
}
