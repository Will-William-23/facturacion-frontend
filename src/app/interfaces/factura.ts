export interface DetalleVenta {
    producto: { 
        id: number; 
        nombre?: string; 
        precio?: number; 
        grabaIva?: boolean;
    }; 
    cantidad: number;
    subtotal?: number;
}

export interface FacturaRequest {
    cliente: { id: number };
    formaPago: string; // <-- NUEVO CAMPO
    detalles: DetalleVenta[];
}