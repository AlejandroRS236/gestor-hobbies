import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Perfil } from '../tipos';
import { texto } from '../formato';

interface Props {
  perfil: Perfil;
  onGuardar: (perfil: Perfil) => Promise<void>;
  onCancelar: () => void;
}

export function FormularioPerfil({ perfil, onGuardar, onCancelar }: Props) {
  const [nombre, setNombre] = useState(texto(perfil.nombre));
  const [avatarUrl, setAvatarUrl] = useState(texto(perfil.avatarUrl));
  const [fondoUrl, setFondoUrl] = useState(texto(perfil.fondoUrl));
  const [error, setError] = useState<string | null>(null);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    try {
      await onGuardar({ nombre: nombre || null, avatarUrl: avatarUrl || null, fondoUrl: fondoUrl || null });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="fondo-modal" onClick={onCancelar}>
      <form className="modal" onSubmit={enviar} onClick={(e) => e.stopPropagation()} aria-label="Editar perfil">
        <h2>Editar perfil</h2>
        <div className="campos">
          <label className="ancho">
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </label>
          <label className="ancho">
            Foto de perfil (enlace a una imagen)
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
          </label>
          <label className="ancho">
            Fondo de los escaparates de figuras (enlace a una imagen)
            <input value={fondoUrl} onChange={(e) => setFondoUrl(e.target.value)} placeholder="https://..." />
          </label>
        </div>
        <p className="pista">Si dejas el fondo vacío se usa el azul liso.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="acciones">
          <span className="espacio" />
          <button type="button" className="secundario" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="principal">Guardar</button>
        </div>
      </form>
    </div>
  );
}
