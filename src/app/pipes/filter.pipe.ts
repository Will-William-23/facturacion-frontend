import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {

  transform(items: any[], searchText: string, fields: string | string[] = 'nombre'): any[] {
    if (!items) return [];
    if (!searchText) return items;

    searchText = searchText.toLowerCase();

    // Normalizar fields a un array
    const fieldArray = Array.isArray(fields) ? fields : [fields];

    return items.filter(it => {
      // Verificar si alguno de los campos coincide
      return fieldArray.some(field => {
        // Resolver valor anidado (ej: 'cliente.nombre')
        const value = field.split('.').reduce((obj, key) => obj?.[key], it);
        
        // Convertir a string y comparar
        const strValue = value ? value.toString().toLowerCase() : '';
        return strValue.includes(searchText);
      });
    });
  }
}

