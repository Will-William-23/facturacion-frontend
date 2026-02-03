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
import { TiendaComponent } from './pages/tienda/tienda.component';
import { ComprasComponent } from './pages/compras/compras.component';
import { MenuComponent } from './pages/menu/menu.component'; // <--- IMPORTANTE: IMPORTAR ESTO
import { authGuard } from './guards/auth-guard.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { 
    path: 'tienda', 
    component: TiendaComponent, 
    canActivate: [authGuard] 
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      
      // ESTA ES LA LÍNEA QUE TE FALTABA PARA QUE EL BOTÓN FUNCIONE:
      { path: 'menu', component: MenuComponent }, 
      
      { path: 'clientes', component: ClientesComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'facturacion', component: FacturacionComponent },
      { path: 'compras', component: ComprasComponent },
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