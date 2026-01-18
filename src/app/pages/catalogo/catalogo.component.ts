import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { Producto } from '../../interfaces/producto';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-catalogo',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './catalogo.component.html',
    styleUrls: ['./catalogo.component.css']
})
export class CatalogoComponent implements OnInit {

    productos: Producto[] = [];
    productoSeleccionado: Producto | null = null;
    cantidadSeleccionada: number = 1;

    // DEBUG UI
    loading: boolean = true;
    errorMsg: string = '';

    cartItemCount: number = 0; // <--- NEW

    constructor(
        private api: ApiService,
        public cartService: CartService, // Changed to public to access in template if needed, or stick to private and use a getter
        private cd: ChangeDetectorRef,
        private router: Router // Import Router
    ) { }

    ngOnInit(): void {
        this.cargarProductos();
        // Subscribe to cart changes to update the badge
        this.cartService.cart$.subscribe(items => {
            this.cartItemCount = items.reduce((acc, item) => acc + item.cantidad, 0);
        });
    }

    cargarProductos() {
        this.loading = true;
        this.api.get('productos').subscribe({
            next: (data) => {
                this.productos = data;
                this.loading = false;
                console.log('Productos cargados:', data);
                this.cd.detectChanges(); // <--- FORCE UPDATE
            },
            error: (e) => {
                console.error('Error cargando productos', e);
                this.errorMsg = 'Error al cargar productos: ' + (e.error?.message || e.message || 'Desconocido');
                this.loading = false;
                this.cd.detectChanges(); // <--- FORCE UPDATE
            }
        });
    }

    abrirModal(producto: Producto) {
        this.productoSeleccionado = producto;
        this.cantidadSeleccionada = 1;
    }

    cerrarModal() {
        this.productoSeleccionado = null;
    }

    agregarAlCarrito() {
        if (this.productoSeleccionado) {
            this.cartService.addToCart(this.productoSeleccionado, this.cantidadSeleccionada);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Producto añadido al carrito',
                showConfirmButton: false,
                timer: 1500
            });
            this.cerrarModal();
        }
    }

    incrementarCantidad() {
        if (this.productoSeleccionado) {
            const available = this.getAvailableStock(this.productoSeleccionado);
            if (this.cantidadSeleccionada < available) {
                this.cantidadSeleccionada++;
            }
        }
    }

    decrementarCantidad() {
        if (this.cantidadSeleccionada > 1) {
            this.cantidadSeleccionada--;
        }
    }
    irAlCarrito() {
        this.router.navigate(['/carrito']);
    }
    getAvailableStock(producto: Producto): number {
        if (!producto.id) return producto.stock || 0;

        const cartItem = this.cartService.getItems().find(item => item.producto.id === producto.id);
        const inCart = cartItem ? cartItem.cantidad : 0;
        return (producto.stock || 0) - inCart;
    }

    logout() {
        this.api.logout();
        this.router.navigate(['/login']);
    }
}
