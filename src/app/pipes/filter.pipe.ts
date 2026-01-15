import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {

  transform(items: any[], searchText: string, field: string = 'nombre'): any[] {
    if (!items) return [];
    if (!searchText) return items;

    searchText = searchText.toLowerCase();

    return items.filter(it => {
      // Busca en el campo especificado (ej: nombre)
      const val = it[field] ? it[field].toString().toLowerCase() : '';
      // O busca en una combinación si es necesario
      return val.includes(searchText);
    });
  }
}

