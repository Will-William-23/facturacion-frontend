export interface Producto {
    id?: number;
    codigoPrincipal: string; // Nuevo
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    grabaIva: boolean; // Nuevo
}