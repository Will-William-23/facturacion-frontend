export interface DetalleVenta {
    producto: { id: number; nombre?: string; precio?: number }; // Datos mixtos para lógica y vista
    cantidad: number;
    subtotal?: number; // Solo para mostrar en tabla
}

export interface FacturaRequest {
    cliente: { id: number };
    detalles: DetalleVenta[];
}