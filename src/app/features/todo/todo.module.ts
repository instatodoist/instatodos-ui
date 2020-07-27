import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TodoRoutingModule } from './todo-routing.module';
import { SharedModule } from '../shared/shared.module';
import { TodoInboxComponent } from './todo-inbox/todo-inbox.component';
import { TodoCompletedComponent } from './todo-completed/todo-completed.component';
import { TodoDeleteComponent } from './todo-delete/todo-delete.component';
import { TodoLabelListComponent } from './todo-label-list/todo-label-list.component';
import { TodoLabelDialogComponent } from './todo-label-dialog/todo-label-dialog.component';
import { TodoSingleComponent } from './todo-single/todo-single.component';

@NgModule({
  declarations: [
    TodoInboxComponent,
    TodoCompletedComponent,
    TodoDeleteComponent,
    TodoLabelListComponent,
    TodoLabelDialogComponent,
    TodoSingleComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TodoRoutingModule,
    SharedModule,
    DragDropModule
  ],
  exports: [
    TodoDeleteComponent,
  ]
})
export class TodoModule { }
