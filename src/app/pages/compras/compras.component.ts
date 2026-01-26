import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Proveedor } from '../../interfaces/proveedor';
import { Producto } from '../../interfaces/producto';
import { DetalleCompraRequest, CompraRequest } from '../../interfaces/compra';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './compras.component.html',
  styleUrls: ['./compras.component.css']
})
export class ComprasComponent implements OnInit {

  proveedores: Proveedor[] = [];
  productos: Producto[] = [];

  provSeleccionado: number | null = null;
  prodSeleccionado: number | null = null;
  cantidad: number = 1;
  costo: number = 0;
  numComprobante: string = '';

  prodActual: Producto | null = null;
  carrito: DetalleCompraRequest[] = [];
  total: number = 0;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.api.getProveedores().subscribe(data => this.proveedores = data);
    this.api.get('productos').subscribe(data => this.productos = data);
  }

  onProdChange() {
    this.prodActual = this.productos.find(p => p.id == this.prodSeleccionado) || null;
    // Sugerir el precio de venta como costo inicial (luego el usuario lo cambia)
    if (this.prodActual) this.costo = this.prodActual.precio; 
  }

  agregar() {
    if (!this.prodActual || this.cantidad <= 0 || this.costo <= 0) return;

    this.carrito.push({
      producto: { id: this.prodActual.id!, nombre: this.prodActual.nombre },
      cantidad: this.cantidad,
      costoUnitario: this.costo,
      subtotal: this.cantidad * this.costo
    });

    this.calcularTotal();
    this.prodSeleccionado = null;
    this.prodActual = null;
    this.cantidad = 1;
    this.costo = 0;
  }

  eliminar(i: number) {
    this.carrito.splice(i, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.total = this.carrito.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  }

  guardar() {
    if (!this.provSeleccionado || this.carrito.length === 0 || !this.numComprobante) {
      Swal.fire('Faltan Datos', 'Complete proveedor, comprobante y productos.', 'warning');
      return;
    }

    const compra: CompraRequest = {
      proveedor: { id: this.provSeleccionado },
      numeroComprobante: this.numComprobante,
      detalles: this.carrito
    };

    Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading() });

    this.api.registrarCompra(compra).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Compra registrada. El stock ha sido actualizado.', 'success').then(() => {
          this.router.navigate(['/productos']); // Ir al inventario para ver el aumento
        });
      },
      error: () => Swal.fire('Error', 'No se pudo registrar la compra', 'error')
    });
  }
}