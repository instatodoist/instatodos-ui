import { Apollo } from 'apollo-angular';
import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  TODO_LIST_QUERY,
  TODO_LIST_COUNT_QUERY,
  TODO_COMPLETED_QUERY,
  TODO_COMPLETED_COUNT_QUERY,
  TODO_UPDATE_MUTATION,
  TODO_DELETE_MUTATION,
  TODO_ADD_MUTATION,
  TODO_PROJECT_QUERY
} from '../../graphql/gql/todo.gql';

import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  TodoConditions,
  TodoCompletedListType,
  TodoType,
  ITodoTypeCount,
  ISuccessType,
  IGQLVariable
} from '../../models';
@Injectable({
  providedIn: 'root'
})

export class TodoService {
  private TODOTYPES = this.todoTypes(); // todo route types
  constructor(
    private apollo: Apollo,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  // priorities array
  get getPriorities() {
    return [
      {
        label: 'Priority 1',
        name: 'P1',
        color: 'red'
      },
      {
        label: 'Priority 2',
        name: 'P2',
        color: 'orange'
      },
      {
        label: 'Priority 3',
        name: 'P3',
        color: 'blue'
      },
      {
        label: 'Priority 4',
        name: 'P4',
        color: 'rgb(86, 75, 75)'
      }
    ];
  }

  // populate color for the label
  getColor(priority: string): string {
    const priorityObj = this.getPriorities.filter(item => item.name === priority);
    return priorityObj[0].color;
  }

  /**
   * @description - Return route modules
   */
  todoTypes() {
    return {
      upcoming: 'upcoming',
      inbox: 'inbox',
      today: 'today',
      pending: 'pending',
      completed: 'completed',
      label: 'label'
    };
  }

  /**
   * @param type - current route type
   * @description - used to get the refetch condition for current route for aplolo
   */
  getConditions(type: string, extraParams = null): TodoConditions {
    if (type === this.TODOTYPES.today) {
      return {
        offset: 1,
        first: 50,
        sort: {
          updatedAt: 'ASC'
        },
        filter: {
          type: 'today'
        }
      };
    } else if (type === this.TODOTYPES.upcoming) {
      return {
        offset: 1,
        first: 50,
        sort: {
          scheduledDate: 'ASC'
        },
        filter: {
          type: 'upcoming'
        }
      };
    } else if (type === this.TODOTYPES.completed) {
      return {
        offset: 1,
        first: 10,
        sort: {
          updatedAt: 'DESC'
        }
      };
    } else if (type === this.TODOTYPES.pending) {
      return {
        offset: 1,
        first: 50,
        sort: {
          scheduledDate: 'DESC'
        },
        filter: {
          type: 'pending'
        }
      };
    } else if (type === this.TODOTYPES.inbox) {
      return {
        offset: 1,
        first: 50,
        sort: {
          createdAt: 'DESC'
        },
        filter: {
          type: 'backlog'
        }
      };
    } else if (extraParams && extraParams === 'labels') {
      return {
        offset: 1,
        first: 50,
        sort: {
          createdAt: 'DESC'
        },
        filter: {
          projectId: type,
          isCompleted: false
        }
      };
    } else {
      return {
        offset: 1,
        first: 50,
        sort: {
          createdAt: 'DESC'
        },
        filter: {
          isCompleted: false
        }
      };
    }
  }

  /**
   * @param conditions - filter params while fetching todos
   */
  listTodos(conditions: TodoConditions): Observable<any> {
    return this.apollo
      .watchQuery({
        query: TODO_LIST_QUERY,
        variables: conditions,
        fetchPolicy: 'cache-and-network'
      })
      .valueChanges;
  }

  /**
   * @param conditions - filter params while fetching todos
   */
  listTodosCount(conditions: TodoConditions): Observable<ITodoTypeCount> {
    return this.apollo
      .watchQuery({
        query: TODO_LIST_COUNT_QUERY,
        variables: conditions
        // fetchPolicy: 'network-only'
      })
      .valueChanges.pipe(map(({ data }: any) => ({
          pending: data.pending.totalCount || 0,
          today: data.today.totalCount || 0,
          inbox: data.inbox.totalCount || 0,
          completed: data.completed.totalCount || 0,
          upcoming: data.upcoming.totalCount || 0
        })));
  }

  /**
   * @param conditions - filter params while fetching todos
   */
  listCompletedTodos(conditions: TodoConditions): Observable<any> {
    return this.apollo
      .watchQuery({
        query: TODO_COMPLETED_QUERY,
        variables: conditions,
        fetchPolicy: 'cache-and-network'
      })
      .valueChanges;
  }

  /**
   * @param conditions - filter params while fetching todos
   */
  listCompletedTodosCount(conditions: TodoConditions): Observable<TodoCompletedListType> {
    return this.apollo
      .watchQuery({
        query: TODO_COMPLETED_COUNT_QUERY,
        variables: conditions,
        fetchPolicy: 'network-only'
      })
      .valueChanges.pipe(map(({ data }: any) => data.todoCompleted));
  }

  /**
   * @description - getting count for tasks
   */
  callTodoCountService() {
    const todoTypes = this.todoTypes();
    const obs1 = this.listTodosCount(this.getConditions(todoTypes.inbox));
    const obs2 = this.listTodosCount(this.getConditions(todoTypes.today));
    const obs3 = this.listTodosCount(this.getConditions(todoTypes.pending));
    const obs4 = this.listCompletedTodosCount(this.getConditions(todoTypes.completed));
    return forkJoin([
      obs1,
      obs2,
      obs3,
      obs4
    ]);
  }

  getCurentRoute(): string {
    let todoCurrentType = '';
    if (this.router.url.match('/tasks/today')) { // checking route if today
      todoCurrentType = this.TODOTYPES.today;
    } else if (this.router.url.match('/tasks/upcoming')) { // checking route if today
      todoCurrentType = this.TODOTYPES.upcoming;
    } else if (this.router.url.match('/tasks/completed')) { // checking route if completed
      todoCurrentType = this.TODOTYPES.completed;
    } else if (this.router.url.match('/tasks/inbox')) { // checking route if inbox
      todoCurrentType = this.TODOTYPES.inbox;
    } else if (this.router.url.match('/tasks/pending')) { // checking route if inbox
      todoCurrentType = this.TODOTYPES.pending;
    }
    return todoCurrentType;
  }

    /** --- refactor services ---*/
  // create
  createTodo(body: TodoType, conditions: any = null): Observable<ISuccessType>{
    const refetchQuery = this.createRefetchQuery(conditions);
    const defaultDataKey = 'addTodo';
    const postTodo = this.createTodoPayload(body);
    // initialising gql variables
    const variables: IGQLVariable<string,  TodoType> = {};
    variables.input = postTodo;
    return this.apollo.mutate({
      mutation: TODO_ADD_MUTATION,
      variables,
      refetchQueries: [
        ...refetchQuery
      ]
    })
      .pipe(map(({ data }: any) => data[defaultDataKey]));
  }

  // update
  updateTodo(body: TodoType, conditions: any = null): Observable<ISuccessType>{
    const refetchQuery = this.createRefetchQuery(conditions);
    const defaultDataKey = 'updateTodo';
    const postTodo = this.createTodoPayload(body);
    // initialising gql variables
    const variables: IGQLVariable<string,  TodoType> = {};
    variables.input = {
      ...postTodo,
      isCompleted: !!body.isCompleted
    };
    // eslint-disable-next-line no-underscore-dangle
    variables.id = body._id;
    return this.apollo.mutate({
      mutation: TODO_UPDATE_MUTATION,
      variables,
      refetchQueries: [
        ...refetchQuery
      ]
    })
      .pipe(map(({ data }: any) => data[defaultDataKey]));
  }

  // delete
  deleteTodo(body: TodoType, conditions: any = null): Observable<ISuccessType>{
    const refetchQuery = this.createRefetchQuery(conditions);
    const defaultDataKey = 'deleteTodo';
    const variables: IGQLVariable<string,  TodoType> = {};
    // eslint-disable-next-line no-underscore-dangle
    variables.id = body._id;
    return this.apollo.mutate({
      mutation: TODO_DELETE_MUTATION,
      variables,
      refetchQueries: [
        ...refetchQuery
      ]
    })
      .pipe(map(({ data }: any) => data[defaultDataKey]));
  }

  private createRefetchQuery(conditions: any = null, type?: string): any{
    // refetch query
    const refetchQuery: any = {
      query: TODO_LIST_QUERY
    };
    // if passing conditions
    if (conditions) {
      refetchQuery.variables = { ...conditions };
    }
    return [
        ...[refetchQuery],
        {
          query: TODO_LIST_COUNT_QUERY,
          variables: {
            filter: {
              isCompleted: true
            }
          }
        },
        {
          query: TODO_PROJECT_QUERY,
          variables: {
            sort: { updatedAt: 'ASC' }
          }
        }
      ];
  }

  private createTodoPayload(body: TodoType): TodoType {
    const postTodo: TodoType = {};
    // check notes
    if(body.notes){
      postTodo.notes = body.notes;
    }
    // eslint-disable-next-line no-underscore-dangle
    if(body._id){
      postTodo.noteId = body.noteId;
    }
    // checking title
    if (body.title) {
      postTodo.title = body.title;
    }
    if (body.projectId) {
      postTodo.projectId = body.projectId;
    }
    // checking labels
    if (body.labelIds && body.labelIds.length) {
      postTodo.labelIds = body.labelIds;
    } else {
      postTodo.labelIds = [];
    }
    // checking scheduling
    if (body.scheduledDate) {
      postTodo.scheduledDate = body.scheduledDate;
    } else {
      postTodo.scheduledDate = null;
    }
    postTodo.subTasks = body.subTasks;
    return postTodo;
  }
}
