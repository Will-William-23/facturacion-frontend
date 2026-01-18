import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Producto } from '../interfaces/producto';
import { ApiService } from './api.service'; // Import ApiService

export interface CartItem {
    producto: Producto;
    cantidad: number;
    subtotal: number;
}

@Injectable({
    providedIn: 'root'
})
export class CartService {

    private cartItems = new BehaviorSubject<CartItem[]>([]);
    cart$ = this.cartItems.asObservable();

    constructor(private api: ApiService) {
        this.loadFromStorage();
    }

    addToCart(producto: Producto, cantidad: number) {
        const currentItems = this.cartItems.value;
        const existingItem = currentItems.find(item => item.producto.id === producto.id);

        if (existingItem) {
            existingItem.cantidad += cantidad;
            existingItem.subtotal = existingItem.cantidad * (existingItem.producto.precio || 0);
            this.cartItems.next([...currentItems]);
        } else {
            const newItem: CartItem = {
                producto,
                cantidad,
                subtotal: cantidad * (producto.precio || 0)
            };
            this.cartItems.next([...currentItems, newItem]);
        }
        this.saveToStorage();
    }

    removeFromCart(productoId: number) {
        const currentItems = this.cartItems.value.filter(item => item.producto.id !== productoId);
        this.cartItems.next(currentItems);
        this.saveToStorage();
    }

    clearCart() {
        this.cartItems.next([]);
        this.saveToStorage();
    }

    getTotal(): number {
        return this.cartItems.value.reduce((acc, item) => acc + item.subtotal, 0);
    }

    getItems(): CartItem[] {
        return this.cartItems.value;
    }

    private saveToStorage() {
        const username = this.api.getUsername();
        if (username) {
            localStorage.setItem(`cart_${username}`, JSON.stringify(this.cartItems.value));
        }
    }

    private loadFromStorage() {
        const username = this.api.getUsername();
        if (username) {
            const stored = localStorage.getItem(`cart_${username}`);
            if (stored) {
                this.cartItems.next(JSON.parse(stored));
            } else {
                this.cartItems.next([]);
            }
        }
    }
}
