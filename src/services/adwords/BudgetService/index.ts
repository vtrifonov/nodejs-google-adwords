import { pd } from 'pretty-data';
import _ from 'lodash';

import { SoapService, AdwordsOperationService } from '../../core';
import { ISelector, IPaging, IOperation } from '../../../types/adwords';
import { Predicate, Operator } from '../../../types/enum';
import { IBudget } from './Budget';
import { IPage, IListReturnValue } from '../../../types/abstract';

interface IBudgetServiceOpts {
  soapService: SoapService;
}
class BudgetService extends AdwordsOperationService {
  /**
   * Budget amounts need to be in units.  1,000,000 units = $1.00 / ¥1.00 / ...
   * Based on the selected settlement currency
   *
   * @static
   * @memberof BudgetService
   */
  public static readonly UNIT = 1000 * 1000;

  /**
   * https://developers.google.com/adwords/api/docs/appendix/selectorfields#v201809-BudgetService
   *
   * @private
   * @static
   * @type {string[]}
   * @memberof BudgetService
   */
  private static readonly selectorFields: string[] = [
    'Amount',
    'BudgetId',
    'BudgetName',
    'BudgetReferenceCount',
    'BudgetStatus',
    'DeliveryMethod',
    'IsBudgetExplicitlyShared',
  ];

  private soapService: SoapService;
  constructor(options: IBudgetServiceOpts) {
    super();
    this.soapService = options.soapService;
  }

  public async getAll() {
    const serviceSelector: ISelector = {
      fields: BudgetService.selectorFields,
    };
    return this.get(serviceSelector);
  }

  public async getByPage(paging: IPaging) {
    const defaultPaging: IPaging = {
      startIndex: 0,
      numberResults: 5,
    };
    const serviceSelector: ISelector = {
      fields: BudgetService.selectorFields,
      paging: _.defaults(paging, defaultPaging),
    };
    return this.get(serviceSelector);
  }

  public async getById(id: string) {
    const serviceSelector: ISelector = {
      fields: BudgetService.selectorFields,
      predicates: [
        {
          field: 'BudgetId',
          operator: Predicate.Operator.EQUALS,
          values: [id],
        },
      ],
    };

    return this.get(serviceSelector);
  }

  public async getByIds(ids: string[]) {
    const serviceSelector: ISelector = {
      fields: BudgetService.selectorFields,
      predicates: [
        {
          field: 'BudgetId',
          operator: Predicate.Operator.IN,
          values: ids,
        },
      ],
    };

    return this.get(serviceSelector);
  }

  public async add(budget: IBudget) {
    // TODO: validate budget
    // TODO: support multiple add
    const operations: Array<IOperation<IBudget, 'BudgetOperation'>> = [
      {
        operator: Operator.ADD,
        operand: budget,
      },
    ];
    return this.mutate(operations);
  }

  public async update(budget: IBudget) {
    const operation: IOperation<IBudget, 'BudgetOperation'> = {
      operator: Operator.SET,
      operand: budget,
    };
    return this.mutate([operation]);
  }

  public async remove(budgetIds: string[]) {
    const operations: Array<IOperation<IBudget, 'BudgetOperation'>> = budgetIds.map((budgetId: string) => {
      const operand: IBudget = { budgetId };
      const operation: IOperation<IBudget, 'BudgetOperation'> = {
        operator: Operator.REMOVE,
        operand,
      };
      return operation;
    });

    return this.mutate(operations);
  }

  protected async get<ServiceSelector = ISelector, Rval = IPage<IBudget>>(
    serviceSelector: ServiceSelector,
  ): Promise<Rval> {
    return this.soapService.get<ServiceSelector, Rval>(serviceSelector).then((response: Rval) => {
      return response;
    });
  }

  protected async mutate<Operation = IOperation<IBudget, 'BudgetOperation'>, Response = IListReturnValue<IBudget>>(
    operations: Operation[],
  ): Promise<Response> {
    try {
      const response = await this.soapService.mutateAsync<Operation, Response>(operations);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export { BudgetService, IBudgetServiceOpts };
export * from './ApiError';
export * from './Budget';
export * from './FieldPathElement';
export * from './enum/Budget';
