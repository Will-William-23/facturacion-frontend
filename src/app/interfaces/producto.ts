export interface Producto {
    id?: number;
    nombre: string;
    descripcion: string;
    precio: number;
    precioCompra?: number;
    stock: number;
    imagen?: string;
    tipo?: string;
    proveedor?: any;
}