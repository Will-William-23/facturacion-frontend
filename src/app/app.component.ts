import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'facturacion-frontend';
  // Ya no necesitamos ngOnInit ni localStorage.clear() aquí.
  // La gestión de sesión se hará automáticamente con sessionStorage en el servicio.
}