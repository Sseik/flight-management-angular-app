import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// ІМПОРТ: Зверніть увагу, файл без суфікса .component
import { ArchiveComponent } from './archive'; 

const routes: Routes = [
  { 
    path: '', 
    component: ArchiveComponent 
  }
];

@NgModule({
  imports: [
    CommonModule,
    ArchiveComponent, // Імпорт Standalone компонента
    RouterModule.forChild(routes)
  ]
})
export class ArchiveModule { }