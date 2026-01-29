export interface FacturaResumen {
    id: number;
    fecha: string;
    total: number;
    cliente: { nombre: string; apellido: string; cedula: string };
    estadoSri: string;
}