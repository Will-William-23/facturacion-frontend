export interface Producto {
    id?: number;
    codigoPrincipal: string;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    grabaIva: boolean;
    imagenUrl?: string; // Nuevo campo opcional
}