// Lo que guardamos dentro del token: solo el id del usuario
export interface JwtPayload {
  sub: number; // "subject": el id del usuario
}
