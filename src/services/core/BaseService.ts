import { IAttributes } from './../../types/adwords/Attributes';
import { SoapService, ISoapServiceOpts } from './SoapService';
import { AdwordsOperationService } from './AdwordsOperationService';
import { ISelector, IOperation, IPaging, IPredicate } from '../../types/adwords';
import { Operator, Predicate } from '../../types/enum';
import { IListReturnValue, IPage } from '../../types/abstract';

export interface IOperationServiceOptions {
  soapService: SoapService;
}

export interface IServiceInfo {
  idField?: string;
  operationType: string;
  selectorFields: string[];
  // the idea of this method is to allow modifying the input type as in some cases like in CampaignExtensionSettingService
  // the input type does not inlcude details for sitelink fields like sitelinkFinalUrlSuffix
  modifyMutateInputOperand?: ((original: any) => any) | undefined;
}

export abstract class BaseService<T, TName> extends AdwordsOperationService {
  public static readonly namespace;
  protected readonly soapService: SoapService;
  protected readonly serviceInfo: IServiceInfo;

  constructor(options: IOperationServiceOptions, serviceInfo: IServiceInfo) {
    super();
    this.soapService = options.soapService;
    this.serviceInfo = serviceInfo;
  }

  public async getAll(paging?: IPaging) {
    const serviceSelector: ISelector = {
      fields: this.serviceInfo.selectorFields,
    };
    if (paging) {
      serviceSelector.paging = paging;
    }
    return this.get(serviceSelector);
  }

  public async getByIds(ids: string[], paging?: IPaging) {
    if (!this.serviceInfo.idField) {
      return Promise.reject('Id select not supported by this service type');
    }
    const serviceSelector: ISelector = {
      fields: this.serviceInfo.selectorFields,
      predicates: [
        {
          field: this.serviceInfo.idField,
          operator: Predicate.Operator.IN,
          values: ids,
        },
      ],
    };
    if (paging) {
      serviceSelector.paging = paging;
    }
    return this.get(serviceSelector);
  }

  public add(operands: T[]) {
    const operations: Array<IOperation<T, TName>> = operands.map((operand: T) => {
      if (this.needToSetAttribute(operand)) {
        operand = this.setType(operand);
      }
      const operation: IOperation<T, TName> = {
        operator: Operator.ADD,
        operand,
      };
      return operation;
    });
    return this.mutate(operations);
  }

  public update(operands: T[]) {
    const operations: Array<IOperation<T, TName>> = operands.map((operand: T) => {
      const operation: IOperation<T, TName> = {
        operator: Operator.SET,
        operand,
      };
      return operation;
    });
    return this.mutate(operations);
  }

  public async getByPredicates(
    predicates: IPredicate[],
    paging?: IPaging,
    selectorFields?: string[],
  ): Promise<IPage<T>> {
    const serviceSelector: ISelector = {
      fields: selectorFields ? selectorFields : this.serviceInfo.selectorFields,
      predicates,
    };
    if (paging) {
      serviceSelector.paging = paging;
    }
    return this.get(serviceSelector);
  }

  protected setType(operand: T): T {
    return operand;
  }

  protected needToSetAttribute(operand: T): boolean {
    return !(operand as any).attributes || !(operand as any).attributes['xsi:type'];
  }

  protected async get<ServiceSelector = ISelector, Rval = IPage<T>>(serviceSelector: ServiceSelector): Promise<Rval> {
    return this.soapService.get<ServiceSelector, Rval>(serviceSelector).then((rval) => {
      return rval;
    });
  }

  protected async mutate<MutateOperation = IOperation<T, TName>, Rval = IListReturnValue<T>>(
    operations: MutateOperation[],
  ): Promise<Rval> {
    return this.soapService
      .mutateAsync<MutateOperation, Rval>(
        operations,
        this.serviceInfo.operationType,
        this.serviceInfo.modifyMutateInputOperand,
      )
      .then((rval) => {
        return rval;
      });
  }
}
