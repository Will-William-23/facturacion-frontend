export interface DetalleCompraRequest {
    producto: { id: number; nombre?: string };
    cantidad: number;
    costoUnitario: number;
    subtotal?: number;
}

export interface CompraRequest {
    proveedor: { id: number };
    numeroComprobante: string;
    detalles: DetalleCompraRequest[];
}