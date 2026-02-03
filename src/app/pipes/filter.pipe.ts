import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {

  // Recibe n argumentos (campos) para buscar
  transform(items: any[], searchText: string, ...fields: string[]): any[] {
    if (!items) return [];
    if (!searchText) return items;

    searchText = searchText.toLowerCase();

    return items.filter(it => {
      // Revisa cada campo que le pasamos
      for (const field of fields) {
        const val = it[field] ? it[field].toString().toLowerCase() : '';
        if (val.includes(searchText)) {
          return true; // Si encuentra coincidencia en ALGUNO, lo devuelve
        }
      }
      return false;
    });
  }
}