import { GridOdataService, OdataServiceApi, OdataOption } from '@slickgrid-universal/odata';
import {
  ReactGridInstance,
  Column,
  FieldType,
  Filters,
  GridOption,
  GridStateChange,
  Metrics,
  OperatorType,
  Pagination,
  ReactSlickgridCustomElement,
} from '../../slickgrid-react';
import React from 'react';

const defaultPageSize = 20;
const sampleDataRoot = 'assets/data';

interface Props { }

export default class Example5 extends React.Component {
  title = 'Example 5: Grid with Backend OData Service';
  subTitle = `
    Use it when you need to support Pagination with a OData endpoint (for simple JSON, use a regular grid)<br/>
    Take a look at the (<a href="https://github.com/ghiscoding/slickgrid-react/wiki/OData" target="_blank">Wiki documentation</a>)
    <br/>
    <ul class="small">
      <li>Only "Name" field is sortable for the demo (because we use JSON files), however "multiColumnSort: true" is also supported</li>
      <li>This example also demos the Grid State feature, open the console log to see the changes</li>
      <li>String column also support operator (>, >=, <, <=, <>, !=, =, ==, *)
      <ul>
        <li>The (*) can be used as startsWith (ex.: "abc*" => startsWith "abc") / endsWith (ex.: "*xyz" => endsWith "xyz")</li>
        <li>The other operators can be used on column type number for example: ">=100" (greater than or equal to 100)</li>
      </ul>
      <li>OData Service could be replaced by other Service type in the future (GraphQL or whichever you provide)</li>
      <li>You can also preload a grid with certain "presets" like Filters / Sorters / Pagination <a href="https://github.com/ghiscoding/slickgrid-react/wiki/Grid-State-&-Preset" target="_blank">Wiki - Grid Preset</a>
      <li><span class="text-danger">NOTE:</span> For demo purposes, the last column (filter & sort) will always throw an
        error and its only purpose is to demo what would happen when you encounter a backend server error
        (the UI should rollback to previous state before you did the action).
        Also changing Page Size to 50,000 will also throw which again is for demo purposes.
      </li>
    </ul>
  `;
  reactGrid!: ReactGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions!: GridOption;
  dataset = [] = [];
  metrics!: Metrics;
  paginationOptions!: Pagination;

  isCountEnabled = true;
  odataVersion = 2;
  odataQuery = '';
  processing = false;
  errorStatus = '';
  isPageErrorTest = false;
  status = { text: '', class: '' };

  constructor(public readonly props: Props) {
    super(props);
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  reactGridReady(reactGrid: ReactGridInstance) {
    this.reactGrid = reactGrid;
  }

  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'name', name: 'Name', field: 'name', sortable: true,
        type: FieldType.string,
        filterable: true,
        filter: {
          model: Filters.compoundInput
        }
      },
      {
        id: 'gender', name: 'Gender', field: 'gender', filterable: true,
        filter: {
          model: Filters.singleSelect,
          collection: [{ value: '', label: '' }, { value: 'male', label: 'male' }, { value: 'female', label: 'female' }]
        }
      },
      { id: 'company', name: 'Company', field: 'company', filterable: true, sortable: true },
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10
      },
      checkboxSelector: {
        // you can toggle these 2 properties to show the "select all" checkbox in different location
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true
      },
      enableCellNavigation: true,
      enableFiltering: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      enablePagination: true, // you could optionally disable the Pagination
      pagination: {
        pageSizes: [10, 20, 50, 100, 500, 50000],
        pageSize: defaultPageSize,
        totalItems: 0
      },
      presets: {
        // you can also type operator as string, e.g.: operator: 'EQ'
        filters: [
          { columnId: 'gender', searchTerms: ['male'], operator: OperatorType.equal },
        ],
        sorters: [
          // direction can be written as 'asc' (uppercase or lowercase) and/or use the SortDirection type
          { columnId: 'name', direction: 'asc' },
        ],
        pagination: { pageNumber: 2, pageSize: 20 }
      },
      backendServiceApi: {
        service: new GridOdataService(),
        options: {
          enableCount: this.isCountEnabled, // add the count in the OData query, which will return a property named "odata.count" (v2) or "@odata.count" (v4)
          version: this.odataVersion        // defaults to 2, the query string is slightly different between OData 2 and 4
        },
        onError: (error: Error) => {
          this.errorStatus = error.message;
          this.displaySpinner(false, true);
        },
        preProcess: () => {
          this.errorStatus = '';
          this.displaySpinner(true);
        },
        process: (query) => this.getCustomerApiCall(query),
        postProcess: (response) => {
          this.metrics = response.metrics;
          this.displaySpinner(false);
          this.getCustomerCallback(response);
        }
      } as OdataServiceApi
    };
  }

  displaySpinner(isProcessing: boolean, isError?: boolean) {
    this.processing = isProcessing;
    if (isError) {
      this.status = { text: 'ERROR!!!', class: 'alert alert-danger' };
    } else {
      this.status = (isProcessing)
        ? { text: 'loading...', class: 'alert alert-warning' }
        : { text: 'finished', class: 'alert alert-success' };
    }
  }

  getCustomerCallback(data: any) {
    // totalItems property needs to be filled for pagination to work correctly
    // however we need to force React to do a dirty check, doing a clone object will do just that
    let countPropName = 'totalRecordCount'; // you can use "totalRecordCount" or any name or "odata.count" when "enableCount" is set
    if (this.isCountEnabled) {
      countPropName = (this.odataVersion === 4) ? '@odata.count' : 'odata.count';
    }
    this.paginationOptions = { ...this.gridOptions.pagination, totalItems: data[countPropName] } as Pagination;
    if (this.metrics) {
      this.metrics.totalItemCount = data[countPropName];
    }

    // once pagination totalItems is filled, we can update the dataset
    this.dataset = data['items'];
    this.odataQuery = data['query'];
  }

  getCustomerApiCall(query: string) {
    // in your case, you will call your WebAPI function (wich needs to return a Promise)
    // for the demo purpose, we will call a mock WebAPI function
    return this.getCustomerDataApiMock(query);
  }

  /**
   * This function is only here to mock a WebAPI call (since we are using a JSON file for the demo)
   *  in your case the getCustomer() should be a WebAPI function returning a Promise
   */
  getCustomerDataApiMock(query: string): Promise<any> {
    // the mock is returning a Promise, just like a WebAPI typically does
    return new Promise(resolve => {
      const queryParams = query.toLowerCase().split('&');
      let top: number;
      let skip = 0;
      let orderBy = '';
      let countTotalItems = 100;
      const columnFilters = {};

      if (this.isPageErrorTest) {
        this.isPageErrorTest = false;
        throw new Error('Server timed out trying to retrieve data for the last page');
      }

      for (const param of queryParams) {
        if (param.includes('$top=')) {
          top = +(param.substring('$top='.length));
          if (top === 50000) {
            throw new Error('Server timed out retrieving 50,000 rows');
          }
        }
        if (param.includes('$skip=')) {
          skip = +(param.substring('$skip='.length));
        }
        if (param.includes('$orderby=')) {
          orderBy = param.substring('$orderby='.length);
        }
        if (param.includes('$filter=')) {
          const filterBy = param.substring('$filter='.length).replace('%20', ' ');
          if (filterBy.includes('contains')) {
            const filterMatch = filterBy.match(/contains\(([a-zA-Z\/]+),\s?'(.*?)'/);
            const fieldName = filterMatch![1].trim();
            (columnFilters as any)[fieldName] = { type: 'substring', term: filterMatch![2].trim() };
          }
          if (filterBy.includes('substringof')) {
            const filterMatch = filterBy.match(/substringof\('(.*?)',([a-zA-Z ]*)/);
            const fieldName = filterMatch![2].trim();
            (columnFilters as any)[fieldName] = { type: 'substring', term: filterMatch![1].trim() };
          }
          if (filterBy.includes('eq')) {
            const filterMatch = filterBy.match(/([a-zA-Z ]*) eq '(.*?)'/);
            if (Array.isArray(filterMatch)) {
              const fieldName = filterMatch![1].trim();
              (columnFilters as any)[fieldName] = { type: 'equal', term: filterMatch![2].trim() };
            }
          }
          if (filterBy.includes('startswith')) {
            const filterMatch = filterBy.match(/startswith\(([a-zA-Z ]*),\s?'(.*?)'/);
            const fieldName = filterMatch![1].trim();
            (columnFilters as any)[fieldName] = { type: 'starts', term: filterMatch![2].trim() };
          }
          if (filterBy.includes('endswith')) {
            const filterMatch = filterBy.match(/endswith\(([a-zA-Z ]*),\s?'(.*?)'/);
            const fieldName = filterMatch![1].trim();
            (columnFilters as any)[fieldName] = { type: 'ends', term: filterMatch![2].trim() };
          }

          // simular a backend error when trying to sort on the "Company" field
          if (filterBy.includes('company')) {
            throw new Error('Server could not filter using the field "Company"');
          }
        }
      }

      // simular a backend error when trying to sort on the "Company" field
      if (orderBy.includes('company')) {
        throw new Error('Server could not sort using the field "Company"');
      }

      const sort = orderBy.includes('asc')
        ? 'ASC'
        : orderBy.includes('desc')
          ? 'DESC'
          : '';

      let url;
      switch (sort) {
        case 'ASC':
          url = `${sampleDataRoot}/customers_100_ASC.json`;
          break;
        case 'DESC':
          url = `${sampleDataRoot}/customers_100_DESC.json`;
          break;
        default:
          url = `${sampleDataRoot}/customers_100.json`;
          break;
      }

      this.http.createRequest(url)
        .asGet()
        .send()
        .then(response => {
          const dataArray = response.content as any[];

          // Read the result field from the JSON response.
          const firstRow = skip;
          let filteredData = dataArray;
          if (columnFilters) {
            for (const columnId in columnFilters) {
              if (columnFilters.hasOwnProperty(columnId)) {
                filteredData = filteredData.filter(column => {
                  const filterType = (columnFilters as any)[columnId].type;
                  const searchTerm = (columnFilters as any)[columnId].term;
                  let colId = columnId;
                  if (columnId && columnId.indexOf(' ') !== -1) {
                    const splitIds = columnId.split(' ');
                    colId = splitIds[splitIds.length - 1];
                  }
                  const filterTerm = column[colId];
                  if (filterTerm) {
                    switch (filterType) {
                      case 'equal': return filterTerm.toLowerCase() === searchTerm;
                      case 'ends': return filterTerm.toLowerCase().endsWith(searchTerm);
                      case 'starts': return filterTerm.toLowerCase().startsWith(searchTerm);
                      case 'substring': return filterTerm.toLowerCase().includes(searchTerm);
                    }
                  }
                });
              }
            }
            countTotalItems = filteredData.length;
          }
          const updatedData = filteredData.slice(firstRow, firstRow + top);

          setTimeout(() => {
            let countPropName = 'totalRecordCount';
            if (this.isCountEnabled) {
              countPropName = (this.odataVersion === 4) ? '@odata.count' : 'odata.count';
            }
            const backendResult = { items: updatedData, [countPropName]: countTotalItems, query };
            // console.log('Backend Result', backendResult);
            resolve(backendResult);
          }, 150);
        });
    });
  }

  goToFirstPage() {
    this.reactGrid.paginationService!.goToFirstPage();
  }

  goToLastPage() {
    this.reactGrid.paginationService!.goToLastPage();
  }

  /** Dispatched event of a Grid State Changed event */
  gridStateChanged(gridStateChanges: GridStateChange) {
    // console.log('Client sample, Grid State changed:: ', gridStateChanges);
    console.log('Client sample, Grid State changed:: ', gridStateChanges.change);
  }

  setFiltersDynamically() {
    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    this.reactGrid.filterService.updateFilters([
      // { columnId: 'gender', searchTerms: ['male'], operator: OperatorType.equal },
      { columnId: 'name', searchTerms: ['A'], operator: 'a*' },
    ]);
  }

  setSortingDynamically() {
    this.reactGrid.sortService.updateSorting([
      { columnId: 'name', direction: 'DESC' },
    ]);
  }

  throwPageChangeError() {
    this.isPageErrorTest = true;
    this.reactGrid?.paginationService?.goToLastPage();
  }

  // YOU CAN CHOOSE TO PREVENT EVENT FROM BUBBLING IN THE FOLLOWING 3x EVENTS
  // note however that internally the cancelling the search is more of a rollback
  handleOnBeforeSort(e: Event) {
    // e.preventDefault();
    // return false;
    return true;
  }

  handleOnBeforeSearchChange(e: Event) {
    // e.preventDefault();
    // return false;
    return true;
  }

  handleOnBeforePaginationChange(e: Event) {
    // e.preventDefault();
    // return false;
    return true;
  }

  // THE FOLLOWING METHODS ARE ONLY FOR DEMO PURPOSES DO NOT USE THIS CODE
  // ---

  changeCountEnableFlag() {
    this.isCountEnabled = !this.isCountEnabled;
    const odataService = this.gridOptions.backendServiceApi!.service as GridOdataService;
    odataService.updateOptions({ enableCount: this.isCountEnabled } as OdataOption);
    odataService.clearFilters();
    this.reactGrid.filterService.clearFilters();
    return true;
  }

  setOdataVersion(version: number) {
    this.odataVersion = version;
    const odataService = this.gridOptions.backendServiceApi!.service as GridOdataService;
    odataService.updateOptions({ version: this.odataVersion } as OdataOption);
    odataService.clearFilters();
    this.reactGrid.filterService.clearFilters();
    return true;
  }

  render() {
    return (
      <div id="demo-container" className="container-fluid">
        <h2>
          {this.title}
          <span className="float-right">
            <a style={{ fontSize: '18px' }}
              target="_blank"
              href="https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/example5.ts">
              <span className="fa fa-link"></span> code
            </a>
          </span>
        </h2>
        <div className="row">
          <div className="col-sm-9">
            <div className="subtitle">{this.subTitle}</div>
          </div>
          <div className="col-sm-3">
            {this.errorStatus && <div className="alert alert-danger" data-test="error-status">
              <em><strong>Backend Error:</strong> <span>{this.errorStatus}</span></em>
            </div>}
          </div>
        </div>

        <div className="row">
          <div className="col-sm-4">
            <div className={this.status.class} role="alert" data-test="status">
              <strong>Status: </strong> {this.status.text}
              {!this.processing && <span>
                <i className="fa fa-refresh fa-spin fa-lg fa-fw"></i>
              </span>}
            </div>
            <button className="btn btn-outline-secondary btn-sm" data-test="set-dynamic-filter"
              onClick={this.setFiltersDynamically}>
              Set Filters Dynamically
            </button>
            <button className="btn btn-outline-secondary btn-sm" data-test="set-dynamic-sorting"
              onClick={this.setSortingDynamically}>
              Set Sorting Dynamically
            </button>
            <br />
            {this.metrics && <span>
              <b>Metrics:</b> {this.metrics.endTime} | {this.metrics.executionTime}ms |
              {this.metrics.totalItemCount}
              items
            </span>}
          </div>
          <div className="col-sm-8">
            <div className="alert alert-info" data-test="alert-odata-query">
              <strong>OData Query:</strong> <span data-test="odata-query-result">{this.odataQuery}</span>
            </div>
            <label>OData Version: </label>
            <span data-test="radioVersion">
              <label className="radio-inline control-label" htmlFor="radio2">
                <input type="radio" name="inlineRadioOptions" data-test="version2" id="radio2" checked value="2"
                  onClick={() => this.setOdataVersion(2)} /> 2
              </label>
              <label className="radio-inline control-label" htmlFor="radio4">
                <input type="radio" name="inlineRadioOptions" data-test="version4" id="radio4" value="4"
                  onClick={() =>this.setOdataVersion(4)} /> 4
              </label>
            </span>
            <label className="checkbox-inline control-label" htmlFor="enableCount" style={{ marginLeft: '20px' }}>
              <input type="checkbox" id="enableCount" data-test="enable-count" checked={this.isCountEnabled}
                onClick={this.changeCountEnableFlag} />
              <span style={{ fontWeight: 'bold' }}>Enable Count</span> (add to OData query)
            </label>
            <span className="float-right">
              <button className="btn btn-outline-danger btn-sm " data-test="throw-page-error-btn"
                onClick={this.throwPageChangeError}>
                <span>Throw Error Going to Last Page... </span>
                <i className="mdi mdi-page-last"></i>
              </button>
            </span>
          </div >
        </div >
        <div className="row">
          <div className="col-md-12">
            <label>Programmatically go to first/last page:</label>
            <button className="btn btn-outline-secondary btn-xs" data-test="goto-first-page" onClick={this.goToFirstPage}>
              <i className="fa fa-caret-left fa-lg"></i>
            </button>
            <button className="btn btn-outline-secondary btn-xs" data-test="goto-last-page" onClick={this.goToLastPage}>
              <i className="fa fa-caret-right fa-lg"></i>
            </button>
          </div>
        </div>

        <ReactSlickgridCustomElement gridId="grid5"
          columnDefinitions={this.columnDefinitions}
          gridOptions={this.gridOptions}
          dataset={this.dataset}
          customEvents={{
            paginationOptions:this.paginationOptions,
            onReactGridCreated:$event => this.reactGridReady($event.detail),
            onGridStateChanged:$event => this.gridStateChanged($event.detail),
            onBeforeSort:$event => this.handleOnBeforeSort($event),
            onBeforeSearchChange:$event => this.handleOnBeforeSearchChange($event),
            onBeforePaginationChange:$event => this.handleOnBeforePaginationChange($event)
          }} />
      </div>
    );
  }
}

