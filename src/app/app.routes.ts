import { Routes } from '@angular/router';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { FacturacionComponent } from './pages/facturacion/facturacion.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { HistorialComponent } from './pages/historial/historial.component';
import { ContactanosComponent } from './pages/contactanos/contactanos.component';
import { ProveedoresComponent } from './pages/proveedores/proveedores.component';
import { ConfiguracionComponent } from './pages/configuracion/configuracion.component';
import { MenuComponent } from './pages/menu/menu.component';
import { authGuard } from './guards/auth-guard.component'; // <--- IMPORTAR

export const routes: Routes = [
  // Rutas Públicas
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Rutas Privadas (Protegidas por authGuard)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard], // <--- AQUÍ PROTEGEMOS TODO EL SISTEMA
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'menu', component: MenuComponent },
      { path: 'clientes', component: ClientesComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'facturacion', component: FacturacionComponent },
      { path: 'usuarios', component: UsuariosComponent },
      { path: 'historial', component: HistorialComponent },
      { path: 'contactanos', component: ContactanosComponent },
      { path: 'proveedores', component: ProveedoresComponent },
      { path: 'configuracion', component: ConfiguracionComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login' }
];