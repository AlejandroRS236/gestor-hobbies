package com.gestorhobbies.core.figuras;

import com.gestorhobbies.core.comun.Elemento;
import com.gestorhobbies.core.comun.Enlace;
import com.gestorhobbies.core.tiendas.Confianza;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Entity
@Table(name = "figura")
public class Figura extends Elemento {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private EstadoFigura estado;

    private String fabricante;

    /** Código JAN (código de barras), útil para buscar la figura exacta. */
    @Column(length = 13)
    private String jan;

    private String riesgo;

    /** Número de la figura en MyFigureCollection, si se ha importado de allí. */
    @Column(name = "mfc_id", length = 20)
    private String mfcId;

    @Embedded
    private FichaTecnica ficha;

    @ElementCollection
    @CollectionTable(name = "figura_participante", joinColumns = @JoinColumn(name = "figura_id"))
    @OrderColumn(name = "orden")
    private List<Participante> participantes = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "figura_lanzamiento", joinColumns = @JoinColumn(name = "figura_id"))
    @OrderColumn(name = "orden")
    private List<Lanzamiento> lanzamientos = new ArrayList<>();

    @OneToMany(mappedBy = "figura", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("fecha ASC, id ASC")
    private List<CambioEstado> historial = new ArrayList<>();

    protected Figura() {
        // JPA
    }

    public Figura(String titulo, EstadoFigura estado) {
        super(titulo);
        cambiarEstado(estado);
    }

    public void cambiarEstado(EstadoFigura nuevo) {
        cambiarEstado(nuevo, Clock.systemUTC());
    }

    /** Cambia el estado y, si es distinto del actual, lo apunta en el historial. */
    public void cambiarEstado(EstadoFigura nuevo, Clock reloj) {
        Objects.requireNonNull(nuevo, "estado");
        if (nuevo != estado) {
            historial.add(new CambioEstado(this, estado, nuevo, Instant.now(reloj)));
            this.estado = nuevo;
        }
    }

    /** Desde cuándo está en su estado actual (null si no hay historial). */
    public Instant estadoDesde() {
        return historial.isEmpty() ? null : historial.get(historial.size() - 1).getFecha();
    }

    public List<CambioEstado> getHistorial() {
        return java.util.Collections.unmodifiableList(historial);
    }

    /** La fecha límite más próxima entre las tiendas que siguen siendo opción. */
    public Optional<LocalDate> pedirAntesDe() {
        return getEnlaces().stream()
                .filter(Enlace::esOpcionValida)
                .map(Enlace::getPedirAntesDe)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder());
    }

    /** Si quedan {@code dias} días o menos para la fecha límite más próxima. */
    public boolean fechaLimiteCercana(LocalDate hoy, int dias) {
        return pedirAntesDe()
                .filter(fecha -> !fecha.isBefore(hoy) && !fecha.isAfter(hoy.plusDays(dias)))
                .isPresent();
    }

    /** Si alguna de sus tiendas está marcada como "no comprar". */
    public boolean tieneTiendaNoComprar() {
        return getEnlaces().stream().anyMatch(e -> e.getTienda().getConfianza() == Confianza.NO_COMPRAR);
    }

    /** Sustituye la ficha técnica completa (datos, participantes y lanzamientos). */
    public void aplicarFicha(DatosFicha datos) {
        Objects.requireNonNull(datos, "datos");
        ficha = new FichaTecnica(datos.categoria(), datos.serie(), datos.personaje(), datos.version(),
                datos.escala(), datos.alturaMm(), datos.pesoG(), datos.materiales(), datos.avisos());
        participantes.clear();
        datos.participantes().forEach(p -> participantes.add(new Participante(p.nombre(), p.rol())));
        lanzamientos.clear();
        datos.lanzamientos().forEach(l ->
                lanzamientos.add(new Lanzamiento(l.fecha(), l.edicion(), l.precio(), l.moneda(), l.jan())));
    }

    public DatosFicha datosFicha() {
        FichaTecnica f = ficha == null ? new FichaTecnica() : ficha;
        return new DatosFicha(f.getCategoria(), f.getSerie(), f.getPersonaje(), f.getVersion(), f.getEscala(),
                f.getAlturaMm(), f.getPesoG(), f.getMateriales(), f.getAvisos(),
                participantes.stream().map(p -> new DatosFicha.DatosParticipante(p.getNombre(), p.getRol())).toList(),
                lanzamientos.stream().map(l -> new DatosFicha.DatosLanzamiento(
                        l.getFecha(), l.getEdicion(), l.getPrecio(), l.getMoneda(), l.getJan())).toList());
    }

    public String getMfcId() {
        return mfcId;
    }

    public void setMfcId(String mfcId) {
        if (mfcId != null && !mfcId.isBlank() && !mfcId.strip().matches("\\d+")) {
            throw new IllegalArgumentException("El número de MyFigureCollection solo lleva cifras");
        }
        this.mfcId = mfcId == null || mfcId.isBlank() ? null : mfcId.strip();
    }

    public EstadoFigura getEstado() {
        return estado;
    }

    public String getFabricante() {
        return fabricante;
    }

    public void setFabricante(String fabricante) {
        this.fabricante = fabricante;
    }

    public String getJan() {
        return jan;
    }

    public void setJan(String jan) {
        if (jan != null && !jan.isBlank() && !jan.strip().matches("\\d{8}|\\d{13}")) {
            throw new IllegalArgumentException("El código JAN debe tener 8 o 13 dígitos");
        }
        this.jan = jan == null || jan.isBlank() ? null : jan.strip();
    }

    public String getRiesgo() {
        return riesgo;
    }

    public void setRiesgo(String riesgo) {
        this.riesgo = riesgo;
    }
}
