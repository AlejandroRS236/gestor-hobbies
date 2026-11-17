import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RevisionMfc } from './RevisionMfc';
import type { CandidatoMfc, Figura } from '../tipos';
import { fichaVacia } from '../tipos';

const candidato = (mfcId: string, titulo: string, extra: Partial<CandidatoMfc> = {}): CandidatoMfc => ({
  mfcId, titulo, fabricante: 'Taito', imagenUrl: null, imagenes: null, jan: null, ficha: null, sugeridaId: null, sugeridaTitulo: null,
  parecido: 0, yaImportada: false, ...extra,
});

const figura = (id: number, titulo: string) => ({ id, titulo }) as Figura;

describe('RevisionMfc', () => {
  it('propone fusionar las sugeridas, crear las nuevas y omitir las ya importadas', async () => {
    const onConfirmar = vi.fn().mockResolvedValue(undefined);
    render(
      <RevisionMfc
        vistas={[{
          estado: 'ME_GUSTA',
          candidatos: [
            candidato('1', 'Makise Kurisu - Racing', { sugeridaId: 7, sugeridaTitulo: 'Kurisu Racing', parecido: 0.8 }),
            candidato('2', 'Frieren - Desktop Cute'),
            candidato('3', 'Yor Forger', { yaImportada: true, sugeridaId: 9 }),
          ],
        }]}
        figuras={[figura(7, 'Kurisu Racing'), figura(9, 'Yor')]}
        onConfirmar={onConfirmar}
        onCancelar={vi.fn()}
      />,
    );

    expect(screen.getByText('1 nuevas · 1 se completarán · 1 sin importar')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Qué hacer con Frieren - Desktop Cute'), { target: { value: 'omitir' } });
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));

    await waitFor(() => expect(onConfirmar).toHaveBeenCalledTimes(1));
    const decisiones = onConfirmar.mock.calls[0][0];
    expect(decisiones.map((d: { decision: { accion: string } }) => d.decision.accion))
      .toEqual(['FUSIONAR', 'OMITIR', 'OMITIR']);
    expect(decisiones[0].decision.figuraId).toBe(7);
    expect(decisiones[0].estado).toBe('ME_GUSTA');
  });

  it('junta varios archivos y propone completar las ya importadas si traen ficha', () => {
    const ficha = { ...fichaVacia, alturaMm: 243 };
    render(
      <RevisionMfc
        vistas={[
          { estado: 'ME_GUSTA', candidatos: [candidato('1', 'Kurisu Racing', { yaImportada: true, sugeridaId: 7 })] },
          {
            estado: 'ME_GUSTA',
            candidatos: [candidato('1', 'Kurisu Racing', { yaImportada: true, sugeridaId: 7, ficha })],
          },
          { estado: 'LA_TENGO', candidatos: [candidato('2', 'Roy Mustang')] },
        ]}
        figuras={[figura(7, 'Kurisu Racing')]}
        onConfirmar={vi.fn()}
        onCancelar={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByLabelText('Qué hacer con Kurisu Racing')).toHaveValue('f:7');
    expect(screen.getByText(/entrará en La tengo/)).toBeInTheDocument();
  });
});
