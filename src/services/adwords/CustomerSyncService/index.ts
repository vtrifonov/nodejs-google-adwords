import { AdwordsOperationService, IOperationServiceOptions } from '../../core';
import { ISelector, IPaging } from '../../../types/adwords';
import { ICustomerChangeData, IChangedIds } from './CustomerChangeData';
import { IDateTimeRange } from './DateTimeRange';
import { ICustomerSyncSelector } from './CustomerSyncSelector';
import moment from 'moment';
import 'moment-timezone';
import { ICheckEntities } from './CheckEntities';
import { ChangeStatus } from '../../../types/enum';
import { ICampaignChangeData } from './CampaignChangeData';
import { IAdGroupChangeData } from './AdGroupChangeData';
import _ from 'lodash';

class CustomerSyncService extends AdwordsOperationService {
  public static readonly namespace = 'https://adwords.google.com/api/adwords/ch';
  /**
   * https://developers.google.com/adwords/api/docs/reference/v201809/CustomerSyncService
   *
   * @private
   * @static
   * @type {string[]}
   * @memberof CustomerSyncService
   */
  private static readonly selectorFields: string[] = ['dateTimeRange', 'campaignIds', 'feedIds'];
  protected readonly operationServiceOptions: IOperationServiceOptions;
  constructor(operationServiceOptions: IOperationServiceOptions) {
    super();
    this.operationServiceOptions = operationServiceOptions;
  }

  public async getChanges(
    startDate: Date | string,
    endDate: Date | string,
    checkEntities: ICheckEntities = { all: true },
    paging?: IPaging,
  ): Promise<ICustomerChangeData> {
    const dateTimeRange: IDateTimeRange = {
      min: startDate instanceof Date ? this.getStringDate(startDate) : startDate.toString(),
      max: endDate instanceof Date ? this.getStringDate(endDate) : endDate.toString(),
    };

    if (checkEntities.all) {
      checkEntities.campaignIds = await this.operationServiceOptions.adWordsService
        .getService('CampaignService', this.operationServiceOptions.options)
        .getAllIds();
      checkEntities.feedIds = await this.operationServiceOptions.adWordsService
        .getService('FeedService', this.operationServiceOptions.options)
        .getAllIds();
    }

    const serviceSelector: ICustomerSyncSelector = {
      dateTimeRange,
      campaignIds: checkEntities.campaignIds || [],
      feedIds: checkEntities.feedIds || [],
      fields: CustomerSyncService.selectorFields,
      paging,
    };

    const result = await this.get(serviceSelector);
    // do not return data for not changed items
    this.filterEmptyNodes(result);
    result.changedIds = this.getChangedIds(result);

    return result;
  }

  protected async get<ServiceSelector = ISelector, Rval = ICustomerChangeData>(
    serviceSelector: ServiceSelector,
  ): Promise<Rval> {
    return this.operationServiceOptions.soapService.get<ServiceSelector, Rval>(serviceSelector).then((rval: Rval) => {
      return rval;
    });
  }

  private filterEmptyNodes(result: ICustomerChangeData) {
    result.changedCampaigns = result.changedCampaigns.filter(
      (x) =>
        x.campaignChangeStatus !== ChangeStatus.FIELDS_UNCHANGED ||
        (x.changedAdGroups && x.changedAdGroups.length > 0) ||
        (x.addedCampaignCriteria && x.addedCampaignCriteria.length > 0) ||
        (x.changedFeeds && x.changedFeeds.length > 0) ||
        (x.removedCampaignCriteria && x.removedCampaignCriteria.length > 0) ||
        (x.removedFeeds && x.removedFeeds.length > 0),
    );
    result.changedFeeds = result.changedFeeds.filter(
      (x) =>
        x.feedChangeStatus !== ChangeStatus.FIELDS_UNCHANGED ||
        (x.changedFeedItems && x.changedFeedItems.length > 0) ||
        (x.removedFeedItems && x.removedFeedItems.length > 0),
    );
  }

  private mapReduceArray<T, V>(item: T[], getField: (T) => V[]): V[] {
    const mapped = item.map((x) => getField(x) || []);
    const reduced = mapped.reduce((acc: V[], cur: V[]) => [...acc, ...cur], []);
    return reduced;
  }

  private getChangedIds(result: ICustomerChangeData): IChangedIds {
    const adgroupItems = result.changedCampaigns.filter((x) => x.changedAdGroups);
    const changedAds: string[] = _.uniq(
      this.mapReduceArray(adgroupItems, (x) => this.mapReduceArray(x.changedAdGroups, (y) => y.changedAds)),
    );

    const feedItems = result.changedFeeds.filter((x) => x.changedFeedItems);
    const changedFeedItems: string[] = _.uniq(this.mapReduceArray(feedItems, (x) => x.changedFeedItems));

    const changedCriterias: string[] = _.uniq(
      this.mapReduceArray(adgroupItems, (x) => this.mapReduceArray(x.changedAdGroups, (y) => y.changedCriteria)),
    );

    return {
      changedAds,
      changedFeedItems,
      changedCriterias,
    };
  }

  private getStringDate(date: Date): string {
    return `${moment(date).format('YYYYMMDD HHmmss')} ${moment.tz.guess()}`;
  }
}

export { CustomerSyncService, ICustomerChangeData, IChangedIds, ICheckEntities };
