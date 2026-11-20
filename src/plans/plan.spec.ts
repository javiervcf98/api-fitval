import { PlanRow, toPlan } from './plan';

describe('toPlan', () => {
  it('convierte el precio de texto a número', () => {
    // 1. Preparar: el precio llega como texto, igual que de PostgreSQL
    const row: PlanRow = { id: 1, name: 'Básico', monthly_price: '29.90' };

    // 2. Ejecutar
    const plan = toPlan(row);

    // 3. Comprobar: tiene que ser el NÚMERO 29.9, no el texto "29.90"
    expect(plan.monthlyPrice).toBe(30);
  });
});
