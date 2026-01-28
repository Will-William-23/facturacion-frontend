import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sort',
  standalone: true
})
export class SortPipe implements PipeTransform {

  transform(items: any[], field: string, direction: 'asc' | 'desc' = 'asc'): any[] {
    if (!items || !field) return items;

    return [...items].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      // Manejo de nulls/undefined
      if (valA == null) valA = '';
      if (valB == null) valB = '';

      // Si son strings, comparar ignorando mayúsculas
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) {
        return direction === 'asc' ? -1 : 1;
      } else if (valA > valB) {
        return direction === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });
  }
}