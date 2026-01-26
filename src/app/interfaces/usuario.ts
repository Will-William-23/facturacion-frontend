export interface Usuario {
    id?: number;
    username: string;
    password?: string; // Opcional al editar
    role: string;
}