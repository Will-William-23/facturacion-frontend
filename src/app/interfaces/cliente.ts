export interface Cliente {
    id?: number;
    cedula: string; // <-- Nuevo campo
    nombre: string;
    apellido: string;
    direccion: string;
    email: string;
}