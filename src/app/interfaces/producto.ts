export interface Producto {
    id?: number;
    codigoPrincipal: string;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    imagen?: string;
    tipo?: string;
    grabaIva: boolean;
}