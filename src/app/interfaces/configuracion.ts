export interface Configuracion {
    nombreEmpresa: string;
    ruc: string;
    direccion: string;
    telefono: string;
    email: string; // Nuevo
    sitioWeb: string; // Nuevo
    obligadoContabilidad: string; // SI/NO
    ivaPorcentaje: number;
}